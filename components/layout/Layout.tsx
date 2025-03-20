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
    contact: t('contact.title', 'Contact'),
    admin: t('admin.login', 'Admin')
  };
  
  const pageTitle = title || sectionTitles[section];
  const metaDescription = description || `Patrick Stephens personal website - ${pageTitle} section`;
  
  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as LanguageCode;
    setLanguage(newLanguage);
  };
  
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800">
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
          
          {/* Footer - Modified to include admin button */}
          <footer className="bg-[#FAFAFA] p-4 flex justify-between items-center shadow-inner">
            <div className="flex items-center gap-3">
              <div className="language-selector">
                <select 
                  value={language}
                  onChange={handleLanguageChange}
                  className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Admin button */}
              <div aria-label="Admin Access">
                <AdminButton />
              </div>
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