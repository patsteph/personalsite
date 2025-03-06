import { ReactNode, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import { useTranslation } from '@/lib/translations';

// Page section types
export type PageSection = 'welcome' | 'blog' | 'cv' | 'books' | 'contact' | 'admin';

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
  const router = useRouter();
  const { t } = useTranslation();
  
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

  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Initialize from localStorage if available, otherwise use 'en'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferred_language') || 'en';
    }
    return 'en';
  });
  
  const pageTitle = title || sectionTitles[section];
  const metaDescription = description || `Senior Engineering Manager personal website - ${pageTitle} section`;
  
  return (
    <div className="min-h-screen bg-linen text-steel-blue">
      <Head>
        <title>{`${pageTitle} | Your Name`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="grid grid-cols-1 md:grid-cols-4">
        {/* Left sidebar (25% width on medium+ screens) */}
        <Sidebar currentSection={section} />
        
        {/* Main content area (75% width on medium+ screens) */}
        <main className="md:col-span-3 flex flex-col min-h-screen">
          {/* Header image */}
          <header className="w-full">
            <div className="w-full h-[200px] overflow-hidden">
              <img 
                src={headerImageSrc} 
                alt={`${pageTitle} Header`} 
                className="w-full h-full object-cover transition-opacity duration-500"
                width="800"
                height="200"
              />
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-grow p-6 md:p-8">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="bg-light-accent p-4 flex justify-between items-center">

          <div className="language-selector">
  <select 
    defaultValue="en"
    onChange={(e) => {
      const newLanguage = e.target.value;
      localStorage.setItem('preferred_language', newLanguage);
      // Note: We're not actually changing the language yet
      // This is just to store the preference
    }}
    className="px-3 py-1 rounded border border-steel-blue bg-linen text-steel-blue"
  >
    <option value="en">English</option>
    <option value="es">Español</option>
    <option value="de">Deutsch</option>
    <option value="ja">日本語</option>
    <option value="uk">Українська</option>
  </select>
</div>
            
            <div className="copyright text-sm">
              &copy; {new Date().getFullYear()} Your Name
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}