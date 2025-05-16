// components/layout/Sidebar.tsx
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/translations';
import { useTheme } from '@/components/AppProviders';
import { PageSection } from './types';

type SidebarProps = {
  currentSection: PageSection;
};

export default function Sidebar({ currentSection }: SidebarProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  
  // Social media links
  const socialLinks = {
    github: 'https://github.com/patsteph',
    linkedin: 'https://linkedin.com/in/patrickjstephens/',
    twitter: 'https://twitter.com/StephensCisco',
    bluesky: 'https://bsky.app/profile/stephenspatrickj/'
  };
  
  // Navigation items
  const navItems: { section: PageSection; label: string; href: string }[] = [
    { section: 'welcome', label: t('nav.welcome', 'Welcome'), href: '/' },
    { section: 'books', label: t('nav.books', 'Books'), href: '/books' },
    { section: 'blog', label: t('nav.blog', 'Blog'), href: '/blog' },
    { section: 'signals', label: t('nav.signals', 'Signals'), href: '/signals' },
    { section: 'cv', label: t('nav.cv', 'CV'), href: '/cv' },
    { section: 'contact', label: t('nav.contact', 'Contact'), href: '/contact' },
  ];
  
  return (
    <aside className="bg-linen p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col theme-transition">
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
            sizes="150px"
            loading="eager"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          />
        </div>
        <h2 className="text-xl font-semibold mb-1 text-steel-blue">Patrick Stephens</h2>
        <p className="text-sm text-steel-blue opacity-80">Senior Engineering Manager</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-grow mb-8">
        <ul className="space-y-2">
          {navItems.map(({ section, label, href }) => (
            <li key={section}>
              <Link 
                href={href}
                className={`
                  block px-4 py-2 rounded-lg transition-all duration-200 text-steel-blue
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
      
      {/* Social icons and theme toggle */}
      <div className="flex justify-between items-center">
        {/* Theme Toggle Button - smaller and on the left */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-1.5 rounded-full bg-steel-blue bg-opacity-10 hover:bg-opacity-20 transition-all duration-200"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="text-steel-blue">
              <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="text-dark-text">
              <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
            </svg>
          )}
        </button>
      
        {/* Social icons */}
        <div className="social-icons flex justify-end space-x-3">
          {/* GitHub */}
          <a 
            href={socialLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="text-steel-blue hover:text-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
          
          {/* LinkedIn */}
          <a 
            href={socialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            className="text-steel-blue hover:text-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
            </svg>
          </a>
          
          {/* Twitter */}
          <a 
            href={socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter Profile"
            className="text-steel-blue hover:text-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
            </svg>
          </a>
          
          {/* Bluesky */}
          <a 
            href={socialLinks.bluesky}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bluesky Profile"
            className="text-steel-blue hover:text-accent transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.8C9 10.8 6.2 12.1 4.2 14.3C4.1 14.4 4 14.6 4 14.8C4 15 4.1 15.1 4.2 15.2L4.5 15.6C4.6 15.8 4.8 15.9 5 15.9C5.2 15.9 5.3 15.8 5.4 15.7C7 14.2 9 13.2 11.2 12.9C10.7 13.4 10.3 14 10.1 14.7C9.9 15.3 9.9 15.9 10 16.5C10.1 17.1 10.4 17.7 10.8 18.1C11.2 18.5 11.7 18.8 12.3 18.9C12.9 19 13.5 19 14.1 18.8C14.7 18.6 15.3 18.2 15.7 17.8C16 17.4 16.3 16.9 16.4 16.3C16.5 15.7 16.5 15.1 16.3 14.5C16.1 13.9 15.8 13.3 15.3 12.9C14.9 12.5 14.3 12.2 13.7 12C13.1 11.9 12.5 11.9 11.9 12C11.9 11.9 12 11.9 12 11.9C14.2 11.9 16.2 10.9 17.8 9.4C17.9 9.3 18 9.1 18 8.9C18 8.7 17.9 8.6 17.8 8.5L17.5 8.1C17.4 7.9 17.2 7.8 17 7.8C16.8 7.8 16.7 7.9 16.6 8C15.1 9.6 13.1 10.8 10.9 11.3C11.3 10.9 11.6 10.5 11.8 10C12 9.5 12 9 11.9 8.5C11.8 8 11.6 7.6 11.3 7.2C11 6.8 10.6 6.5 10.1 6.4C9.6 6.3 9.1 6.3 8.6 6.4C8.1 6.5 7.7 6.8 7.3 7.2C7 7.6 6.7 8 6.6 8.5C6.5 9 6.5 9.5 6.7 10C6.9 10.5 7.2 10.9 7.6 11.3C5.4 10.8 3.4 9.6 1.9 8C1.8 7.9 1.7 7.7 1.7 7.5C1.7 7.3 1.8 7.2 1.9 7.1L2.2 6.7C2.3 6.5 2.5 6.4 2.7 6.4C2.9 6.4 3 6.5 3.1 6.6C5.1 8.8 7.9 10.1 10.9 10.1C11.2 10.1 11.6 10.1 11.9 10.1C11.9 10.1 11.9 10.1 12 10.1V10.8Z" fill="currentColor"/>
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}