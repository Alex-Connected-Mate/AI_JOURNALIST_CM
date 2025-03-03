import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMessages, formatDate, formatTime, formatDateTime } from '@/lib/i18n';
import Cookies from 'js-cookie';

// Create the context
const LocaleContext = createContext();

// Cookie name for storing the locale preference
const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * LocaleProvider Component
 * 
 * This provider makes translations and locale functions available throughout the app.
 * It automatically detects the user's browser language and provides translations accordingly.
 */
export function LocaleProvider({ children }) {
  // Supported locales
  const supportedLocales = ['en', 'fr', 'ja'];
  const defaultLocale = 'fr';

  // Initialize locale from cookie or browser settings
  const [locale, setLocale] = useState(() => {
    // For SSR, default to French initially
    if (typeof window === 'undefined') return defaultLocale;
    
    // Try to get from cookie
    const savedLocale = Cookies.get(LOCALE_COOKIE);
    if (savedLocale && supportedLocales.includes(savedLocale)) return savedLocale;
    
    // Try to get from browser settings
    try {
      const browserLocale = navigator.language.split('-')[0];
      if (supportedLocales.includes(browserLocale)) return browserLocale;
    } catch (e) {
      console.error('Error detecting browser locale:', e);
    }
    
    // Default to French
    return defaultLocale;
  });

  // Load messages for the current locale
  const [messages, setMessages] = useState(getMessages(locale));

  // Update messages when locale changes
  useEffect(() => {
    setMessages(getMessages(locale));
    // Update HTML lang attribute
    document.documentElement.lang = locale;
  }, [locale]);

  // Function to change the locale
  const changeLocale = (newLocale) => {
    if (!supportedLocales.includes(newLocale)) return;
    
    // Save preference in cookie
    Cookies.set(LOCALE_COOKIE, newLocale, { expires: 365 });
    
    // Update state
    setLocale(newLocale);
  };

  // Translator function
  const t = (key, defaultValue = '') => {
    // Split the key into parts (e.g. 'session.actions.edit' => ['session', 'actions', 'edit'])
    const parts = key.split('.');
    
    // Traverse the messages object
    let value = messages;
    for (const part of parts) {
      if (!value || !value[part]) {
        // Use setTimeout to avoid state update during rendering
        setTimeout(() => {
        console.warn(`Translation missing for key: ${key}`);
        }, 0);
        return defaultValue || key;
      }
      value = value[part];
    }
    
    // Ensure we return a string, not an object
    if (typeof value === 'object') {
      setTimeout(() => {
        console.warn(`Translation key ${key} returns an object, not a string`);
      }, 0);
      return defaultValue || key;
    }
    
    return value;
  };
  
  // Helper functions for common date/time formatting
  const formatDateFn = (date, options) => formatDate(date, locale, options);
  const formatTimeFn = (date, options) => formatTime(date, locale, options);
  const formatDateTimeFn = (date, options) => formatDateTime(date, locale, options);
  
  // The value provided to consumers
  const value = {
    locale,
    locales: supportedLocales,
    defaultLocale,
    messages,
    changeLocale,
    t,
    formatDate: formatDateFn,
    formatTime: formatTimeFn,
    formatDateTime: formatDateTimeFn,
  };
  
  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

// Hook to use the locale context
export function useTranslation() {
  const context = useContext(LocaleContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  
  return context;
} 