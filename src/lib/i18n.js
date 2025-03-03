// Import all messages statically to avoid dynamic imports which can cause issues
import enMessages from '../messages/en/index.json';
import frMessages from '../messages/fr/index.json';
import jaMessages from '../messages/ja/index.json';

// Message cache
const messageCache = {
  en: enMessages,
  fr: frMessages,
  ja: jaMessages
};

/**
 * Get translated messages for a specific locale
 * @param {string} locale - The locale code (e.g., 'en', 'fr', 'ja')
 * @returns {Object} The messages for the locale, or English messages as fallback
 */
export function getMessages(locale) {
  // Return from cache if available
  if (messageCache[locale]) {
    return messageCache[locale];
  }
  
  // Default to English if locale not found
  console.warn(`Messages for locale '${locale}' not found, using 'en' as fallback`);
  return messageCache.en;
}

/**
 * Format a date for the current locale
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale to use for formatting
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date
 */
export function formatDate(date, locale, options = {}) {
  const defaultOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Format a time for the current locale
 * @param {Date|string|number} date - The date/time to format
 * @param {string} locale - The locale to use for formatting
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted time
 */
export function formatTime(date, locale, options = {}) {
  const defaultOptions = { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true
  };
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting time:', error);
    return String(date);
  }
}

/**
 * Format a date and time for the current locale
 * @param {Date|string|number} date - The date/time to format
 * @param {string} locale - The locale to use for formatting
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date and time
 */
export function formatDateTime(date, locale, options = {}) {
  const defaultOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true
  };
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return String(date);
  }
} 