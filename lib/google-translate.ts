// lib/google-translate.ts
//
// Thin wrapper around Google's free Website Translator element
// (https://translate.google.com/translate_a/element.js). We render it
// hidden and drive its internal <select> from our own footer language
// links, so the page's full text (blog posts, book reviews, CV copy,
// everything) gets translated client-side at zero cost and with no
// backend changes. See docs/DEPLOYMENT.md or the project research doc
// for why this approach was chosen over a paid translation API.

export const GOOGLE_TRANSLATE_ELEMENT_ID = 'google_translate_element';

// Must match the languages already offered in the footer (lib/translations.tsx).
export const GOOGLE_TRANSLATE_LANGUAGES = 'en,es,de,ja,uk';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout: number;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

/**
 * Switches the page's Google-translated language by driving the hidden
 * widget's <select>. Selecting 'en' (the page's original language)
 * restores the untranslated text.
 *
 * The widget renders asynchronously after its script loads, so this
 * polls briefly for the <select> to exist rather than assuming it's
 * there on the first click.
 */
export function setGoogleTranslateLanguage(langCode: string, attempt = 0): void {
  const select = document.querySelector<HTMLSelectElement>('select.goog-te-combo');

  if (!select) {
    if (attempt < 20) {
      setTimeout(() => setGoogleTranslateLanguage(langCode, attempt + 1), 250);
    } else {
      console.warn('Google Translate widget did not initialize in time.');
    }
    return;
  }

  select.value = langCode;
  select.dispatchEvent(new Event('change'));
}
