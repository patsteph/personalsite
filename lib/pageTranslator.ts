// Translates the current page's free-text content (blog posts, book
// reviews, CV copy, etc.) by walking visible text nodes and sending them to
// our own /api/translate route (DeepL under the hood). This exists because
// the site's own lib/translations system only covers known UI strings
// (nav labels, section titles) via t() -- it was never meant to translate
// arbitrary content, and the third-party widgets tried before this (see
// project memory) turned out to be unreliable in ways outside our control.
//
// Elements (or any ancestor) marked data-no-translate are skipped -- use
// that on anything where machine translation would make no sense, like
// code blocks.

const ORIGINAL_TEXT = Symbol('originalText');

type TranslatableNode = Text & { [ORIGINAL_TEXT]?: string };

function getTranslatableTextNodes(root: Node): TranslatableNode[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;
      if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: TranslatableNode[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as TranslatableNode);
    current = walker.nextNode();
  }
  return nodes;
}

async function fetchTranslations(texts: string[], targetLang: string): Promise<Map<string, string>> {
  const CHUNK_SIZE = 50;
  const translated = new Map<string, string>();

  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: chunk, targetLang }),
      });
      if (!res.ok) {
        console.error('Translation request failed:', res.status);
        continue;
      }
      const data = (await res.json()) as { translations: string[] };
      chunk.forEach((text, idx) => {
        if (data.translations[idx]) {
          translated.set(text, data.translations[idx]);
        }
      });
    } catch (error) {
      console.error('Translation request error:', error);
    }
  }

  return translated;
}

/**
 * Translates all visible text under `root` into `lang`. Pass 'en' to
 * restore the original (pre-translation) text instead -- no network call
 * needed, since the original text is kept on each node.
 */
export async function translatePageTo(lang: string, root: Node = document.body): Promise<void> {
  if (lang === 'en') {
    restoreOriginalText(root);
    return;
  }

  const nodes = getTranslatableTextNodes(root);
  if (nodes.length === 0) return;

  const uniqueTexts = Array.from(new Set(nodes.map((node) => node[ORIGINAL_TEXT] ?? node.textContent ?? '')));
  const translatedMap = await fetchTranslations(uniqueTexts, lang);

  for (const node of nodes) {
    const original = node[ORIGINAL_TEXT] ?? node.textContent ?? '';
    node[ORIGINAL_TEXT] = original;
    const translated = translatedMap.get(original);
    if (translated) {
      node.textContent = translated;
    }
  }
}

export function restoreOriginalText(root: Node = document.body): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode() as TranslatableNode | null;
  while (current) {
    if (current[ORIGINAL_TEXT] !== undefined) {
      current.textContent = current[ORIGINAL_TEXT]!;
    }
    current = walker.nextNode() as TranslatableNode | null;
  }
}
