// components/GTranslateWidget.tsx
import Script from 'next/script';

/**
 * GTranslate's free Website Translator widget (gtranslate.io), free for
 * non-commercial personal sites. Translates the whole rendered page --
 * nav, blog posts, book reviews, CV copy -- client-side, at zero cost
 * and with no backend changes.
 *
 * We tried driving Google's own classic Website Translator element
 * first, but Google retired that widget on 2026-10-01, so this
 * replaces it. See the project research doc for the full comparison.
 *
 * Renders into the footer via wrapper_selector, styled in globals.css
 * to sit alongside the existing language links.
 *
 * This site's CSP is script-src 'self' (see next.config.js), with no
 * 'unsafe-inline' -- deliberately, from the earlier security hardening
 * pass. So the widget's settings live in public/gtranslate-settings.js
 * (same-origin, satisfies 'self') instead of an inline script, and
 * next.config.js's script-src allow-lists cdn.gtranslate.net
 * specifically for the one script below rather than relaxing the policy
 * generally. Keep LANGUAGES in public/gtranslate-settings.js in sync
 * with lib/translations.tsx's language list.
 */
export default function GTranslateWidget() {
  return (
    <>
      <div className="gtranslate_wrapper" />
      <Script src="/gtranslate-settings.js" strategy="afterInteractive" />
      <Script
        src="https://cdn.gtranslate.net/widgets/latest/dropdown.js"
        strategy="afterInteractive"
      />
    </>
  );
}
