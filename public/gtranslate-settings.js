// Served same-origin so it satisfies this site's CSP (script-src 'self') --
// see components/GTranslateWidget.tsx, which loads this before the actual
// GTranslate widget script. Keep LANGUAGES here in sync with the LANGUAGES
// array in that component (and with lib/translations.tsx's language list).
window.gtranslateSettings = {
  default_language: "en",
  languages: ["en", "es", "de", "ja", "uk"],
  native_language_names: true,
  wrapper_selector: ".gtranslate_wrapper",
};
