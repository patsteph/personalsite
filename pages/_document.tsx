import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // Real security headers, including Content-Security-Policy, are set on
  // every response from next.config.js's headers() function. A meta-tag CSP
  // is not used here: it would either duplicate or conflict with that header,
  // and a per-page <meta> tag can't express the response-level directives
  // (frame-ancestors, report-to) the header version needs.
  return (
    <Html lang="en">
      <Head>
        {/* Runtime configuration, generated at build time by scripts/generate-config.js */}
        <script src={`${basePath}/runtime-config.js`} async />

        {/* Stylesheet */}
        <link
          rel="stylesheet"
          href={`${basePath}/styles.css`}
          key="global-styles"
        />
      </Head>
      <body>
        <Main />

        {/* GTranslate's free translation widget (components/GTranslateWidget.tsx
            held the React version; see next.config.js's CSP comment for the
            background). Deliberately placed here -- after <Main/>'s markup
            (so its wrapper div below already exists) but before any
            client-side JS runs -- rather than loaded via next/script
            afterInteractive from React. The previous afterInteractive
            placement loaded the widget only after hydration, by which point
            window's load event had already fired; GTranslate's own
            dropdown.js has a known bug (reported by other users, unfixed by
            the vendor) where it crashes with "callback is not a function"
            when that happens. Loading it synchronously here, during initial
            HTML parsing, avoids that case entirely. _document.tsx only runs
            for a full page load, not client-side navigation, so this mounts
            once, the same as the previous _app.tsx placement intended. */}
        <div className="gtranslate_wrapper" />
        <script src={`${basePath}/gtranslate-settings.js`} />
        <script src="https://cdn.gtranslate.net/widgets/latest/dropdown.js" />

        <NextScript />
      </body>
    </Html>
  );
}