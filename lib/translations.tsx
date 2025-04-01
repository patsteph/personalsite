import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import all translations
import en from '@/translations/en.json';
import es from '@/translations/es.json';
import de from '@/translations/de.json';
import ja from '@/translations/ja.json';
import uk from '@/translations/uk.json';

// Define language code type
export type LanguageCode = 'en' | 'es' | 'de' | 'ja' | 'uk';

// Define available languages
export const languages = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
  uk: 'Українська',
};

// Export languages as a constant for easier access
export const LANGUAGES = languages;

// Translations object with all available translations 
// Using any since the structure is nested and complex
const translations: Record<string, any> = {
  en,
  es,
  de,
  ja,
  uk,
};

// Function to dynamically fetch translations if import method fails
const fetchTranslation = async (lang: string): Promise<any> => {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${lang} translation`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${lang} translation:`, error);
    return null;
  }
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Create translation context
type TranslationContextType = {
  t: (key: string, fallbackOrReplacements?: string | Record<string, string>, replacements?: Record<string, string>) => string;
  language: string;
  changeLanguage: (newLanguage: string) => void;
  setLanguage: (newLanguage: string) => void; // Alias for changeLanguage
  languages: Record<string, string>;
};

const TranslationContext = createContext<TranslationContextType>({
  t: (key) => key,
  language: DEFAULT_LANGUAGE,
  changeLanguage: () => {},
  setLanguage: () => {}, // Alias for changeLanguage
  languages,
});

// Get user's preferred language from browser or localStorage
const getUserLanguage = (): string => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering detected, using default language');
    return DEFAULT_LANGUAGE;
  }
  
  try {
    // Check localStorage first
    const storedLang = localStorage.getItem('language');
    console.log('Language from localStorage:', storedLang);
    
    if (storedLang && translations[storedLang]) {
      console.log('Using language from localStorage:', storedLang);
      return storedLang;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    console.log('Browser language detected:', browserLang);
    
    if (translations[browserLang]) {
      console.log('Using browser language:', browserLang);
      return browserLang;
    }
    
    console.log('No matching language found, using default:', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  } catch (error) {
    // Return default language if localStorage or navigator is not available
    console.error('Error accessing browser features:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Provider component
export const TranslationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  
  // Initialize language on client side and load translations if needed
  useEffect(() => {
    const userLang = getUserLanguage();
    console.log('Initializing TranslationProvider with language:', userLang);
    setLanguage(userLang);
    
    // Try to load translations dynamically if they're not properly loaded
    const tryLoadingTranslations = async () => {
      // Check if current translations have empty objects
      const langs = Object.keys(LANGUAGES);
      
      for (const lang of langs) {
        // If the translation object is empty or has no keys, try to fetch it
        if (!translations[lang] || Object.keys(translations[lang]).length === 0) {
          console.log(`Trying to load ${lang} translations dynamically`);
          const fetchedTranslation = await fetchTranslation(lang);
          if (fetchedTranslation) {
            translations[lang] = fetchedTranslation;
            console.log(`Successfully loaded ${lang} translations`);
          }
        }
      }
    };
    
    tryLoadingTranslations();
    
    // Add a listener for storage events to sync language across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue && e.newValue !== language) {
        console.log('Language changed in another tab:', e.newValue);
        setLanguage(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Change language function
  const changeLanguage = (newLanguage: string) => {
    console.log('Changing language to:', newLanguage);
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('language', newLanguage);
          console.log('Language saved to localStorage:', newLanguage);
        } catch (error) {
          console.error('Error saving language to localStorage:', error);
        }
      }
    } else {
      console.warn('Translation not found for language:', newLanguage);
    }
  };
  
  // Translation function
  const t = (key: string, fallbackOrReplacements?: string | Record<string, string>, replacements?: Record<string, string>) => {
    // Safely access nested keys
    const getNestedValue = (obj: any, path: string) => {
      const keys = path.split('.');
      return keys.reduce((acc, curr) => (acc && acc[curr] !== undefined) ? acc[curr] : undefined, obj);
    };
    
    // Get translation for current language, fallback to English
    const currentTranslations = translations[language] || {};
    let translation = getNestedValue(currentTranslations, key);
    
    // Log missing translations
    if (!translation) {
      if (language !== DEFAULT_LANGUAGE) {
        const defaultTranslations = translations[DEFAULT_LANGUAGE] || {};
        translation = getNestedValue(defaultTranslations, key);
        if (translation) {
          console.log(`Translation for key "${key}" not found in "${language}", using default language`);
        }
      }
    }
    
    // If no translation found, use fallback text or key itself
    if (!translation) {
      translation = typeof fallbackOrReplacements === 'string' ? fallbackOrReplacements : key;
      // Only log in development to avoid console spam
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`No translation found for key: "${key}" in any language`);
      }
    }
    
    // Handle replacements
    const replacementsObj = typeof fallbackOrReplacements === 'object' ? fallbackOrReplacements : replacements;
    if (replacementsObj && typeof translation === 'string') {
      Object.entries(replacementsObj).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`{{${k}}}`, 'g'), v || '');
      });
    }
    
    return translation || key;
  };
  
  return (
    <TranslationContext.Provider value={{ 
      t, 
      language, 
      changeLanguage, 
      setLanguage: changeLanguage, // Alias for changeLanguage
      languages 
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook to use translation context
export const useTranslation = () => useContext(TranslationContext);