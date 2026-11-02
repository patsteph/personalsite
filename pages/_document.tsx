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
        <NextScript />
      </body>
    </Html>
  );
}