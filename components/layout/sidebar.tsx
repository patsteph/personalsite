import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/translations';
import { PageSection } from './Layout';

type SidebarProps = {
  currentSection: PageSection;
};

export default function Sidebar({ currentSection }: SidebarProps) {
  const { t } = useTranslation();
  
  // Navigation items
  const navItems: { section: PageSection; label: string; href: string }[] = [
    { section: 'welcome', label: t('nav.welcome', 'Welcome'), href: '/' },
    { section: 'blog', label: t('nav.blog', 'Blog'), href: '/blog' },
    { section: 'cv', label: t('nav.cv', 'CV'), href: '/cv' },
    { section: 'books', label: t('nav.books', 'Books'), href: '/books' },
    { section: 'contact', label: t('nav.contact', 'Contact'), href: '/contact' },
  ];
  
  return (
    <aside className="bg-light-accent p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col">
      {/* Profile section */}
      <div className="profile flex flex-col items-center mb-8">
        <div className="w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-steel-blue mb-4">
          <Image
            src="/images/profile.jpg"
            alt="Profile Photo"
            width={150}
            height={150}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <h2 className="text-xl font-semibold mb-1">Your Name</h2>
        <p className="text-sm opacity-80">Senior Engineering Manager</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-grow mb-8">
        <ul className="space-y-2">
          {navItems.map(({ section, label, href }) => (
            <li key={section}>
              <Link 
                href={href}
                className={`
                  block px-4 py-2 rounded-lg transition-all duration-200
                  ${currentSection === section 
                    ? 'bg-opacity-20 bg-steel-blue transform translate-x-1' 
                    : 'hover:bg-opacity-10 hover:bg-steel-blue hover:translate-x-1'}
                `}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Social icons */}
      <div className="social-icons flex justify-center space-x-4">
        {/* Social icons here... */}
      </div>
    </aside>
  );
}