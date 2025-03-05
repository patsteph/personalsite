import { useRouter } from 'next/router';
import { useCallback } from 'react';

// Translation dictionary types
type TranslationDictionary = {
  [key: string]: string;
};

type TranslationSet = {
  [locale: string]: TranslationDictionary;
};

// Common translations for UI elements
const commonTranslations: TranslationSet = {
  en: {
    // Navigation
    'nav.welcome': 'Welcome',
    'nav.blog': 'Blog',
    'nav.cv': 'CV',
    'nav.books': 'Books',
    'nav.contact': 'Contact',
    
    // Other translations...
  },
  
  es: {
    // Navigation
    'nav.welcome': 'Bienvenido',
    'nav.blog': 'Blog',
    'nav.cv': 'Currículum',
    'nav.books': 'Libros',
    'nav.contact': 'Contacto',
    
    // Other translations...
  },
  
  // Add translations for other languages...
};

/**
 * Hook to provide translation functionality
 */
export function useTranslation() {
  const router = useRouter();
  const locale = router.locale || 'en';
  
  /**
   * Translate a key to the current locale
   */
  const t = useCallback((key: string, fallback?: string): string => {
    const translations = commonTranslations[locale] || commonTranslations.en;
    return translations[key] || fallback || key;
  }, [locale]);
  
  return { t, locale };
}