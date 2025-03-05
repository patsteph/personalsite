import { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from './sidebar';
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
                value={router.locale}
                onChange={(e) => {
                  const newLocale = e.target.value;
                  router.push(router.pathname, router.asPath, { locale: newLocale });
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