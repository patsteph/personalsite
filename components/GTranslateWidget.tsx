// components/GTranslateWidget.tsx
import Script from 'next/script';
import { useState } from 'react';

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
 *
 * Load order matters: dropdown.js reads window.gtranslateSettings once,
 * as soon as it runs, so it must not load until the settings script has
 * actually executed. Two separate next/script tags with the same
 * strategy don't guarantee that order (confirmed live: dropdown.js
 * logged "gtranslateSettings is not properly initialized"), so the
 * second script is only rendered once the first one's onLoad fires.
 */
export default function GTranslateWidget() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  return (
    <>
      <div className="gtranslate_wrapper" />
      <Script
        src="/gtranslate-settings.js"
        strategy="afterInteractive"
        onReady={() => setSettingsLoaded(true)}
      />
      {settingsLoaded && (
        <Script
          src="https://cdn.gtranslate.net/widgets/latest/dropdown.js"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
