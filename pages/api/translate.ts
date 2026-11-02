import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase-admin';

type TranslateResponse = { translations: string[] } | { error: string };

// Full language names for the languages this site offers (see
// lib/translations.tsx), used in the prompt sent to Claude. 'en' is the
// source language and never reaches this route -- the client skips
// calling it for 'en'.
const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish',
  de: 'German',
  ja: 'Japanese',
  uk: 'Ukrainian',
};

const ANTHROPIC_MODEL = 'claude-haiku-5-5';

const MAX_TEXTS_PER_REQUEST = 50;
const MAX_TEXT_LENGTH = 2000;

// Per-IP limit on *requests* (cheap to check, stops a single caller from
// hammering the route) and a separate, global daily cap on cache *misses*
// (the only calls that actually spend the Anthropic key), so nobody --
// whether one abusive caller or many different ones -- can run up the
// bill. Both live in Firestore so they hold across serverless invocations.
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_MAX_REQUESTS_PER_WINDOW = 60;
const DAILY_TRANSLATION_CALL_BUDGET = 500;

function cacheKey(targetLang: string, text: string): string {
  return crypto.createHash('sha256').update(`${targetLang}:${text}`).digest('hex');
}

// Only accept calls that actually come from a page on this site (the
// footer's language buttons, via lib/pageTranslator.ts) -- not just any
// script that knows the URL. This doesn't stop someone from opening the
// site and scripting calls from its own origin, but it blocks the much
// more common case of an outside caller hitting the route directly to
// spend the Anthropic key; the per-IP and daily-budget limits below are
// the real backstop against that remaining case.
function isSameOriginRequest(req: NextApiRequest): boolean {
  const host = req.headers.host;
  const originHeader = req.headers.origin || req.headers.referer;
  if (!host || !originHeader) return false;
  try {
    return new URL(originHeader).host === host;
  } catch {
    return false;
  }
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

async function checkIpRateLimit(db: FirebaseFirestore.Firestore, ip: string): Promise<boolean> {
  const ref = db.collection('translation_rate_limits').doc(crypto.createHash('sha256').update(ip).digest('hex'));
  const now = Date.now();
  let allowed = true;
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data() as { windowStart?: number; count?: number } | undefined;
    if (!data || now - (data.windowStart ?? 0) > IP_WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }
    if ((data.count ?? 0) >= IP_MAX_REQUESTS_PER_WINDOW) {
      allowed = false;
      return;
    }
    tx.update(ref, { count: (data.count ?? 0) + 1 });
  });
  return allowed;
}

/** Reserves up to `wanted` calls out of today's budget; returns how many were granted. */
async function reserveDailyBudget(db: FirebaseFirestore.Firestore, wanted: number): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const ref = db.collection('translation_meta').doc('daily_budget');
  let granted = 0;
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data() as { date?: string; count?: number } | undefined;
    const count = data?.date === today ? data?.count ?? 0 : 0;
    granted = Math.max(0, Math.min(wanted, DAILY_TRANSLATION_CALL_BUDGET - count));
    tx.set(ref, { date: today, count: count + granted });
  });
  return granted;
}

async function translateWithClaude(texts: string[], languageName: string, apiKey: string): Promise<string[]> {
  const prompt =
    `Translate each string in this JSON array from English to ${languageName}. ` +
    `Respond with ONLY a JSON array of the same length, in the same order, each element the translation of the corresponding input string. ` +
    `No commentary, no markdown fences, just the JSON array.\n\n${JSON.stringify(texts)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
  }

  const data = (await response.json()) as { content: { text: string }[] };
  const raw = data.content?.[0]?.text ?? '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error('Anthropic response did not match the expected shape');
  }
  return parsed.map((item) => String(item));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranslateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  if (!isSameOriginRequest(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { texts, targetLang } = req.body as { texts?: unknown; targetLang?: unknown };

  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    !texts.every((text) => typeof text === 'string')
  ) {
    return res.status(400).json({ error: 'texts must be a non-empty array of strings' });
  }
  if (texts.length > MAX_TEXTS_PER_REQUEST) {
    return res.status(400).json({ error: `texts must contain at most ${MAX_TEXTS_PER_REQUEST} items` });
  }
  if (texts.some((text) => text.length > MAX_TEXT_LENGTH)) {
    return res.status(400).json({ error: `each text must be at most ${MAX_TEXT_LENGTH} characters` });
  }

  const languageName = typeof targetLang === 'string' ? LANGUAGE_NAMES[targetLang] : undefined;
  if (!languageName) {
    return res.status(400).json({ error: `unsupported targetLang: ${String(targetLang)}` });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Translation is not configured' });
  }

  try {
    const db = getAdminFirestore();

    const ipAllowed = await checkIpRateLimit(db, getClientIp(req));
    if (!ipAllowed) {
      return res.status(429).json({ error: 'Too many translation requests, please slow down' });
    }

    const results: string[] = new Array(texts.length);
    const misses: { index: number; text: string }[] = [];

    // Cache lookups first, keyed by a hash of (targetLang, sourceText), so
    // repeat page views of the same content don't spend the Anthropic key
    // again.
    await Promise.all(
      texts.map(async (text, index) => {
        const key = cacheKey(targetLang as string, text);
        const doc = await db.collection('translation_cache').doc(key).get();
        if (doc.exists) {
          results[index] = (doc.data() as { translated: string }).translated;
        } else {
          misses.push({ index, text });
        }
      })
    );

    if (misses.length > 0) {
      const granted = await reserveDailyBudget(db, misses.length);
      if (granted < misses.length) {
        console.error(`Daily translation budget exhausted: wanted ${misses.length}, granted ${granted}`);
      }
      const toTranslate = misses.slice(0, granted);
      const skipped = misses.slice(granted);

      // Any misses beyond the remaining budget fall back to the original
      // text rather than failing the whole request.
      skipped.forEach((miss) => {
        results[miss.index] = miss.text;
      });

      if (toTranslate.length > 0) {
        const translated = await translateWithClaude(toTranslate.map((m) => m.text), languageName, apiKey);
        const batch = db.batch();
        toTranslate.forEach((miss, i) => {
          const translatedText = translated[i] ?? miss.text;
          results[miss.index] = translatedText;
          const key = cacheKey(targetLang as string, miss.text);
          batch.set(db.collection('translation_cache').doc(key), {
            sourceText: miss.text,
            targetLang,
            translated: translatedText,
            createdAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      }
    }

    return res.status(200).json({ translations: results });
  } catch (error: any) {
    console.error('Error translating text:', error);
    // TODO(temporary): surfacing error.message to diagnose the second
    // production 500 (credits were the first cause, this is a new one) --
    // remove once that's root-caused.
    return res.status(500).json({ error: `Error translating text: ${error?.message || error}` });
  }
}
