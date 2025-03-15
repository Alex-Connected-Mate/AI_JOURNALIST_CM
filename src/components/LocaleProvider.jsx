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
 * It has been modified to ALWAYS use English, regardless of browser settings or cookies.
 */
export function LocaleProvider({ children }) {
  // Supported locales - only English is used now
  const supportedLocales = ['en'];
  const defaultLocale = 'en';

  // Always use English as the locale
  const [locale, setLocale] = useState('en');

  // Load messages for English locale
  const [messages, setMessages] = useState(getMessages('en'));

  // Update HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  // Function to change the locale - kept for API compatibility
  // but now it only allows changing to English
  const changeLocale = (newLocale) => {
    // Only allow setting to English
    if (newLocale !== 'en') return;
    
    // Save preference in cookie
    Cookies.set(LOCALE_COOKIE, 'en', { expires: 365 });
  };

  // Translator function
  const t = (key, defaultValue = '') => {
    // Split the key into parts (e.g. 'session.actions.edit' => ['session', 'actions', 'edit'])
    const parts = key.split('.');
    
    // Traverse the messages object
    let value = messages;
    for (const part of parts) {
      if (!value || !value[part]) {
        // If translation is missing, return the default value or key
        // but don't log a warning as we're transitioning to English-only
        return defaultValue || key;
      }
      value = value[part];
    }
    
    // Ensure we return a string, not an object
    if (typeof value === 'object') {
      return defaultValue || key;
    }
    
    return value;
  };
  
  // Helper functions for common date/time formatting
  const formatDateFn = (date, options) => formatDate(date, 'en', options);
  const formatTimeFn = (date, options) => formatTime(date, 'en', options);
  const formatDateTimeFn = (date, options) => formatDateTime(date, 'en', options);
  
  // The value provided to consumers
  const value = {
    locale: 'en',
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