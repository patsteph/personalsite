// components/layout/Layout.tsx
import { ReactNode } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Sidebar from './Sidebar';
import AdminButton from '../ui/AdminButton';
import { useTranslation, LanguageCode, LANGUAGES } from '@/lib/translations';

// Import page section types
import { PageSection } from './types';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  section: PageSection;
  headerImage?: string;
};

export default function Layout({
  children,
  title,
  description,
  section,
  headerImage
}: LayoutProps) {
  const { t, language, setLanguage } = useTranslation();
  
  // Default header image based on section
  const defaultHeaderImage = `/images/headers/${section}.jpg`;
  const headerImageSrc = headerImage || defaultHeaderImage;
  
  // Default titles based on section
  const sectionTitles: Record<PageSection, string> = {
    welcome: t('welcome.title', 'Welcome'),
    blog: t('blog.title', 'Blog'),
    cv: t('cv.title', 'Curriculum Vitae'),
    books: t('books.title', 'My Book Collection'),
    signals: t('signals.title', 'Signals'),
    contact: t('contact.title', 'Contact'),
    admin: t('admin.login', 'Admin')
  };
  
  const pageTitle = title || sectionTitles[section];
  const metaDescription = description || `Patrick Stephens personal website - ${pageTitle} section`;
  
  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as LanguageCode;
    console.log('Language selected in dropdown:', newLanguage);
    setLanguage(newLanguage);
    
    // Add immediate visual feedback for the user
    if (e.target) {
      e.target.blur(); // Remove focus
      
      // Flash the select element to indicate change
      e.target.classList.add('bg-blue-100');
      setTimeout(() => {
        if (e.target) {
          e.target.classList.remove('bg-blue-100');
        }
      }, 300);
    }
  };
  
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
        <meta property="og:image" content={headerImageSrc} />
        
        {/* Twitter Card data */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${pageTitle} | Patrick Stephens`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={headerImageSrc} />
        
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
          {/* Header image */}
          <header className="w-full shadow-sm relative">
            <div className="w-full h-[220px] overflow-hidden">
              <Image 
                src={headerImageSrc} 
                alt={`${pageTitle} Header`} 
                className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                width={1200}
                height={220}
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 75vw, 75vw"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[rgba(0,0,0,0.3)] to-transparent h-16"></div>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-grow p-6 md:p-8 text-gray-800">
            {children}
          </div>
          
          {/* Footer with language selection and admin button */}
          <footer className="bg-linen p-4 flex justify-between items-center shadow-inner">
            {/* Admin button moved to far left */}
            <div aria-label="Admin Access">
              <AdminButton />
            </div>
            
            {/* Language selection as horizontal text links */}
            <div className="flex items-center justify-center space-x-3 flex-grow px-4">
              <button 
                onClick={() => setLanguage('en')}
                className={`text-sm hover:text-accent transition-colors ${language === 'en' ? 'font-bold text-accent' : 'text-gray-700'}`}
                title="English"
              >
                Language
              </button>
              <span className="text-gray-400">•</span>
              <button 
                onClick={() => setLanguage('es')}
                className={`text-sm hover:text-accent transition-colors ${language === 'es' ? 'font-bold text-accent' : 'text-gray-700'}`}
                title="Spanish"
              >
                Idioma
              </button>
              <span className="text-gray-400">•</span>
              <button 
                onClick={() => setLanguage('de')}
                className={`text-sm hover:text-accent transition-colors ${language === 'de' ? 'font-bold text-accent' : 'text-gray-700'}`}
                title="German"
              >
                Sprache
              </button>
              <span className="text-gray-400">•</span>
              <button 
                onClick={() => setLanguage('ja')}
                className={`text-sm hover:text-accent transition-colors ${language === 'ja' ? 'font-bold text-accent' : 'text-gray-700'}`}
                title="Japanese"
              >
                言語
              </button>
              <span className="text-gray-400">•</span>
              <button 
                onClick={() => setLanguage('uk')}
                className={`text-sm hover:text-accent transition-colors ${language === 'uk' ? 'font-bold text-accent' : 'text-gray-700'}`}
                title="Ukrainian"
              >
                Мова
              </button>
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