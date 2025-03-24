const React = require('react');
const { useTranslation } = require('./LocaleProvider');

/**
 * LanguageSwitcher Component
 * 
 * A dropdown component to allow users to manually switch between available languages.
 */
module.exports = function LanguageSwitcher() {
  const { locale, locales, changeLocale } = useTranslation();
  
  // Map of locales to their display names
  const localeNames = {
    en: 'English',
    fr: 'Français',
    ja: '日本語',
  };
  
  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        className="appearance-none bg-transparent py-1 pl-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc] || loc}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}