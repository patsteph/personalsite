// components/layout/Layout.tsx
import { ReactNode } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import { useTranslation, LanguageCode } from '@/lib/translations';
import { useEasterEggTrigger } from '@/lib/easter-eggs/useEasterEggTrigger';

// Import page section types
import { PageSection } from './types';

// Short in-language labels for the footer buttons (own name for each language).
const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
  uk: 'Українська',
};

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  ja: 'Japanese',
  uk: 'Ukrainian',
};

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  section: PageSection;
};

export default function Layout({
  children,
  title,
  description,
  section,
}: LayoutProps) {
  const { t, language, setLanguage } = useTranslation();

  // Default titles based on section
  const sectionTitles: Record<PageSection, string> = {
    welcome: t('welcome.title', 'Welcome'),
    blog: t('blog.title', 'Blog'),
    cv: t('cv.title', 'Curriculum Vitae'),
    books: t('books.title', 'My Book Collection'),
    signals: t('signals.title', 'Signals'),
    projects: t('projects.title', 'Projects'),
    contact: t('contact.title', 'Contact'),
    admin: t('admin.login', 'Admin')
  };
  
  const pageTitle = title || sectionTitles[section];
  const metaDescription = description || `Patrick Stephens personal website - ${pageTitle} section`;
  
  // Easter egg trigger (rapid-clicking the language section)
  const languageSectionProps = useEasterEggTrigger('rapid-clicks');

  return (
    <div className="min-h-screen bg-linen text-gray-800 theme-transition">
      <Head>
        <title>{`${pageTitle} | Patrick Stephens`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Improved viewport settings for better mobile experience */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        
        {/* Better SEO with Open Graph tags */}
        <meta property="og:title" content={`${pageTitle} | Patrick Stephens`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:image" content="/images/profile.jpg" />

        {/* Twitter Card data */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${pageTitle} | Patrick Stephens`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="/images/profile.jpg" />
        
        {/* Other meta tags */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#4A6D8C" /> {/* steel-blue color for browser UI */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      
      <div className="grid grid-cols-1 md:grid-cols-4">
        {/* Left sidebar (25% width on medium+ screens) */}
        <Sidebar currentSection={section} />
        
        {/* Main content area (75% width on medium+ screens) */}
        <main className="md:col-span-3 flex flex-col min-h-screen">
          {/* Main content */}
          <div className="flex-grow p-6 md:p-8 text-gray-800">
            {children}
          </div>
          
          {/* Footer. These buttons switch the site's own UI/content strings
              via lib/translations (setLanguage) -- they don't translate
              free-text content like blog posts or book reviews. We tried a
              third-party widget (GTranslate) for that, but its own hosted
              script had an unfixable bug; see the project thread/memory. */}
          <footer className="bg-linen p-4 flex flex-col sm:flex-row justify-between items-center shadow-inner gap-2">
            <div className="flex items-center justify-center space-x-3" {...languageSectionProps}>
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code, i) => (
                <span key={code} className="flex items-center space-x-3">
                  {i > 0 && <span className="text-gray-400">•</span>}
                  <button
                    onClick={() => setLanguage(code)}
                    className={`text-sm hover:text-accent transition-colors ${language === code ? 'font-bold text-accent' : 'text-gray-700'}`}
                    title={LANGUAGE_NAMES[code]}
                  >
                    {LANGUAGE_LABELS[code]}
                  </button>
                </span>
              ))}
            </div>
            <div className="copyright text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Patrick Stephens
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}