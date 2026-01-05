import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
const { useLoggerNew } = require('../hooks/useLoggerNew');

// Liste des langues disponibles
const AVAILABLE_LOCALES = ['fr', 'en', 'es', 'de'];
const DEFAULT_LOCALE = 'fr';

// Types pour le contexte
interface LocaleContextType {
  locale: string;
  changeLocale: (newLocale: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

// Créer le contexte avec une valeur par défaut
const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  changeLocale: () => {},
  t: (key) => key,
});

// Hook pour utiliser la localisation dans les composants
export const useLocale = () => useContext(LocaleContext);

interface LocaleProviderProps {
  children: ReactNode;
}

/**
 * Gestionnaire de traductions
 */
export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const router = useRouter();
  const logger = useLoggerNew('LocaleProvider');
  
  // État local pour la langue actuelle
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  
  // État local pour les traductions
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  
  // Au montage, détecter la langue du navigateur ou du routeur
  useEffect(() => {
    // Éviter d'exécuter côté serveur
    if (typeof window === 'undefined') return;
    
    let detectedLocale = DEFAULT_LOCALE;
    
    // Priorité 1: langue dans l'URL (via Next.js router)
    if (router.locale && AVAILABLE_LOCALES.includes(router.locale)) {
      detectedLocale = router.locale;
    } 
    // Priorité 2: préférence sauvegardée dans localStorage
    else if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('app_locale');
      if (savedLocale && AVAILABLE_LOCALES.includes(savedLocale)) {
        detectedLocale = savedLocale;
      }
      // Priorité 3: langue du navigateur
      else {
        const browserLocale = navigator.language.split('-')[0];
        if (AVAILABLE_LOCALES.includes(browserLocale)) {
          detectedLocale = browserLocale;
        }
      }
    }
    
    logger.debug(`Detected locale: ${detectedLocale}`);
    setLocale(detectedLocale);
    
    // Charger les traductions (simulation)
    // Dans une vraie application, cela chargerait les fichiers de traduction
    setTranslations({
      en: {
        'welcome': 'Welcome to Connected Mate AI Journalist!',
        'app_description': 'Your AI-powered assistant for creating high-quality journalism content quickly and efficiently.',
        'login': 'Log in',
        'logout': 'Log out',
        'register': 'Sign up',
        'login_title': 'Already a user?',
        'login_description': 'Log in to your account and continue creating amazing content.',
        'register_title': 'New to the platform?',
        'register_description': 'Create a new account to start your AI journalism journey.',
        'change_language': 'Change language',
        'dashboard': 'Dashboard',
        'articles': 'Articles',
        'settings': 'Settings',
        'profile': 'Profile',
        'my_account': 'My Account',
        'edit_profile': 'Edit Profile',
        'new_article': 'New Article',
        'article_list': 'My Articles',
        'search': 'Search',
        'notifications': 'Notifications',
        'help': 'Help',
        'about': 'About',
        // Footer translations
        'footer_description': 'AI-powered journalism tools to create high-quality content quickly and efficiently.',
        'about_us': 'About Us',
        'contact': 'Contact',
        'careers': 'Careers',
        'blog': 'Blog',
        'products': 'Products',
        'journalist_ai': 'Journalist AI',
        'content_analyzer': 'Content Analyzer',
        'research_assistant': 'Research Assistant',
        'resources': 'Resources',
        'documentation': 'Documentation',
        'help_center': 'Help Center',
        'tutorials': 'Tutorials',
        'legal': 'Legal',
        'terms': 'Terms',
        'privacy': 'Privacy',
        'cookies': 'Cookies',
        'all_rights_reserved': 'All rights reserved.',
        'terms_of_service': 'Terms of Service',
        'privacy_policy': 'Privacy Policy'
      },
      fr: {
        'welcome': 'Bienvenue sur Connected Mate AI Journalist !',
        'app_description': 'Votre assistant IA pour créer du contenu journalistique de qualité rapidement et efficacement.',
        'login': 'Connexion',
        'logout': 'Déconnexion',
        'register': 'Inscription',
        'login_title': 'Déjà utilisateur ?',
        'login_description': 'Connectez-vous à votre compte et continuez à créer du contenu exceptionnel.',
        'register_title': 'Nouveau sur la plateforme ?',
        'register_description': 'Créez un nouveau compte pour commencer votre parcours en journalisme IA.',
        'change_language': 'Changer de langue',
        'dashboard': 'Tableau de bord',
        'articles': 'Articles',
        'settings': 'Paramètres',
        'profile': 'Profil',
        'my_account': 'Mon compte',
        'edit_profile': 'Modifier le profil',
        'new_article': 'Nouvel article',
        'article_list': 'Mes articles',
        'search': 'Rechercher',
        'notifications': 'Notifications',
        'help': 'Aide',
        'about': 'À propos',
        // Footer translations
        'footer_description': 'Outils de journalisme alimentés par l\'IA pour créer du contenu de qualité rapidement et efficacement.',
        'about_us': 'À propos de nous',
        'contact': 'Contact',
        'careers': 'Carrières',
        'blog': 'Blog',
        'products': 'Produits',
        'journalist_ai': 'IA Journaliste',
        'content_analyzer': 'Analyseur de Contenu',
        'research_assistant': 'Assistant de Recherche',
        'resources': 'Ressources',
        'documentation': 'Documentation',
        'help_center': 'Centre d\'aide',
        'tutorials': 'Tutoriels',
        'legal': 'Mentions légales',
        'terms': 'Conditions',
        'privacy': 'Confidentialité',
        'cookies': 'Cookies',
        'all_rights_reserved': 'Tous droits réservés.',
        'terms_of_service': 'Conditions d\'utilisation',
        'privacy_policy': 'Politique de confidentialité'
      },
      es: {
        'welcome': '¡Bienvenido a Connected Mate AI Journalist!',
        'app_description': 'Tu asistente con IA para crear contenido periodístico de calidad de forma rápida y eficiente.',
        'login': 'Iniciar sesión',
        'logout': 'Cerrar sesión',
        'register': 'Registrarse',
        'login_title': '¿Ya eres usuario?',
        'login_description': 'Inicia sesión en tu cuenta y continúa creando contenido increíble.',
        'register_title': '¿Nuevo en la plataforma?',
        'register_description': 'Crea una nueva cuenta para comenzar tu viaje en el periodismo con IA.',
        'change_language': 'Cambiar idioma',
        'dashboard': 'Panel de control',
        'articles': 'Artículos',
        'settings': 'Configuración',
        'profile': 'Perfil',
        'my_account': 'Mi cuenta',
        'edit_profile': 'Editar perfil',
        'new_article': 'Nuevo artículo',
        'article_list': 'Mis artículos',
        'search': 'Buscar',
        'notifications': 'Notificaciones',
        'help': 'Ayuda',
        'about': 'Acerca de',
        // Footer translations
        'footer_description': 'Herramientas de periodismo con IA para crear contenido de calidad rápida y eficientemente.',
        'about_us': 'Sobre nosotros',
        'contact': 'Contacto',
        'careers': 'Empleo',
        'blog': 'Blog',
        'products': 'Productos',
        'journalist_ai': 'IA Periodista',
        'content_analyzer': 'Analizador de Contenido',
        'research_assistant': 'Asistente de Investigación',
        'resources': 'Recursos',
        'documentation': 'Documentación',
        'help_center': 'Centro de ayuda',
        'tutorials': 'Tutoriales',
        'legal': 'Legal',
        'terms': 'Términos',
        'privacy': 'Privacidad',
        'cookies': 'Cookies',
        'all_rights_reserved': 'Todos los derechos reservados.',
        'terms_of_service': 'Términos de servicio',
        'privacy_policy': 'Política de privacidad'
      },
      de: {
        'welcome': 'Willkommen bei Connected Mate AI Journalist!',
        'app_description': 'Ihr KI-gestützter Assistent zum schnellen und effizienten Erstellen hochwertiger journalistischer Inhalte.',
        'login': 'Anmelden',
        'logout': 'Abmelden',
        'register': 'Registrieren',
        'login_title': 'Bereits Benutzer?',
        'login_description': 'Melden Sie sich bei Ihrem Konto an und erstellen Sie weiterhin erstaunliche Inhalte.',
        'register_title': 'Neu auf der Plattform?',
        'register_description': 'Erstellen Sie ein neues Konto, um Ihre KI-Journalismus-Reise zu beginnen.',
        'change_language': 'Sprache ändern',
        'dashboard': 'Dashboard',
        'articles': 'Artikel',
        'settings': 'Einstellungen',
        'profile': 'Profil',
        'my_account': 'Mein Konto',
        'edit_profile': 'Profil bearbeiten',
        'new_article': 'Neuer Artikel',
        'article_list': 'Meine Artikel',
        'search': 'Suchen',
        'notifications': 'Benachrichtigungen',
        'help': 'Hilfe',
        'about': 'Über uns',
        // Footer translations
        'footer_description': 'KI-gestützte Journalismus-Tools zur schnellen und effizienten Erstellung hochwertiger Inhalte.',
        'about_us': 'Über uns',
        'contact': 'Kontakt',
        'careers': 'Karriere',
        'blog': 'Blog',
        'products': 'Produkte',
        'journalist_ai': 'Journalist KI',
        'content_analyzer': 'Inhaltsanalyse',
        'research_assistant': 'Rechercheassistent',
        'resources': 'Ressourcen',
        'documentation': 'Dokumentation',
        'help_center': 'Hilfezentrum',
        'tutorials': 'Tutorials',
        'legal': 'Rechtliches',
        'terms': 'Bedingungen',
        'privacy': 'Datenschutz',
        'cookies': 'Cookies',
        'all_rights_reserved': 'Alle Rechte vorbehalten.',
        'terms_of_service': 'Nutzungsbedingungen',
        'privacy_policy': 'Datenschutzerklärung'
      }
    });
  }, [router.locale, logger]);
  
  // Fonction pour changer la langue
  const changeLocale = (newLocale: string) => {
    if (AVAILABLE_LOCALES.includes(newLocale)) {
      logger.info(`Changing locale from ${locale} to ${newLocale}`);
      setLocale(newLocale);
      
      // Sauvegarder la préférence
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_locale', newLocale);
      }
      
      // Mettre à jour l'URL (option avancée)
      // router.push(router.pathname, router.pathname, { locale: newLocale });
    } else {
      logger.warn(`Invalid locale: ${newLocale}. Using default: ${DEFAULT_LOCALE}`);
    }
  };
  
  // Fonction de traduction
  const t = (key: string, params?: Record<string, string>) => {
    // Récupérer la traduction ou utiliser la clé si non trouvée
    const translation = translations[locale]?.[key] || key;
    
    // Remplacer les paramètres (ex: "Hello {name}" -> "Hello John")
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replace(`{${param}}`, value),
        translation
      );
    }
    
    return translation;
  };
  
  // Valeur du contexte
  const contextValue: LocaleContextType = {
    locale,
    changeLocale,
    t,
  };
  
  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
};

export default LocaleProvider; 