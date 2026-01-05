import React, { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';
import theme from '../theme';
import LocaleProvider from './LocaleProvider';

// Définition du type des props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * Composant global qui encapsule tous les providers de l'application
 * - ThemeProvider: fournit le thème MUI
 * - SessionContextProvider: fournit l'authentification Supabase
 * - LocaleProvider: fournit la gestion des traductions
 */
const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Configuration de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return (
    <ThemeProvider theme={theme}>
      {/* Reset CSS global */}
      <CssBaseline />
      
      {/* Contexte d'authentification Supabase */}
      <SessionContextProvider supabaseClient={supabase}>
        {/* Contexte de localisation/traduction */}
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </SessionContextProvider>
    </ThemeProvider>
  );
};

export default AppProvider; 