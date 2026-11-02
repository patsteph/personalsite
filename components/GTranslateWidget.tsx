// components/GTranslateWidget.tsx
import Script from 'next/script';

// Must match the languages already offered via lib/translations.tsx.
const LANGUAGES = ['en', 'es', 'de', 'ja', 'uk'];

declare global {
  interface Window {
    gtranslateSettings?: {
      default_language: string;
      languages: string[];
      native_language_names: boolean;
      wrapper_selector: string;
    };
  }
}

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
 */
export default function GTranslateWidget() {
  return (
    <>
      <div className="gtranslate_wrapper" />
      <Script
        id="gtranslate-settings"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.gtranslateSettings = {
              default_language: 'en',
              languages: ${JSON.stringify(LANGUAGES)},
              native_language_names: true,
              wrapper_selector: '.gtranslate_wrapper'
            };
          `,
        }}
      />
      <Script
        src="https://cdn.gtranslate.net/widgets/latest/dropdown.js"
        strategy="afterInteractive"
      />
    </>
  );
}
