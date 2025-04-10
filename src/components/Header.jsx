const React = require('react');
const Link = require('next/link');
const Image = require('next/image');
const LanguageSwitcher = require('./LanguageSwitcher');
const { useTranslation } = require('./LocaleProvider');
const { useRouter } = require('next/navigation');

/**
 * Header Component
 * 
 * A sticky header that remains at the top of the page and provides navigation.
 * Contains navigation links, language switcher, and branding.
 */
const Header = ({ user, logout }) => {
  // Get the translation function from our context
  const { t } = useTranslation();
  const router = useRouter();
  
  // Navigation handlers to ensure direct navigation
  const navigateToDashboard = (e) => {
    e.preventDefault();
    router.push('/dashboard');
  };
  
  const navigateToSettings = (e) => {
    e.preventDefault();
    router.push('/settings');
  };
  
  return (
    <>
      <header className="floating-header">
        <div className="flex items-center gap-4">
          {/* Home icon */}
          <a 
            href="/dashboard" 
            onClick={navigateToDashboard}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </a>
          
          {/* Settings icon */}
          <a 
            href="/settings" 
            onClick={navigateToSettings}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </a>
          
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Divider */}
          <div className="h-4 w-px bg-gray-200"></div>
          
          {/* Powered by */}
          <div className="powered-by flex items-center gap-2">
            <span className="text-xs text-gray-500">Powered by</span>
            <Image 
              src="/logo.png" 
              alt="ConnectedMate Logo" 
              width={40} 
              height={20} 
              priority 
            />
          </div>
          
          {user && (
            <>
              <div className="h-4 w-px bg-gray-200"></div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 hidden md:inline">
                  {user.email}
                </span>
                {logout && (
                  <button 
                    onClick={logout}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-all"
                    aria-label={t('common.logout', 'Déconnexion')}
                    title={t('common.logout', 'Déconnexion')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>
      {/* Add spacing to ensure content doesn't go under the header */}
      <div className="header-spacer"></div>
    </>
  );
};

module.exports = Header; 