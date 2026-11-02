// components/GoogleTranslate.tsx
import Script from 'next/script';
import {
  GOOGLE_TRANSLATE_ELEMENT_ID,
  GOOGLE_TRANSLATE_LANGUAGES,
} from '@/lib/google-translate';

/**
 * Mounts Google's free Website Translator widget, hidden, once per app
 * load. Our own footer language links drive it (see
 * lib/google-translate.ts) instead of its default UI.
 */
export default function GoogleTranslate() {
  return (
    <>
      <div id={GOOGLE_TRANSLATE_ELEMENT_ID} className="hidden" />
      <Script
        id="google-translate-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: '${GOOGLE_TRANSLATE_LANGUAGES}',
                autoDisplay: false,
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
              }, '${GOOGLE_TRANSLATE_ELEMENT_ID}');
            }
          `,
        }}
      />
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
