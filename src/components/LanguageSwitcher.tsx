import React, { useState } from 'react';
import { Button, Menu, MenuItem, Box, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useLocale } from './LocaleProvider';

/**
 * Liste des langues disponibles avec leur drapeau et libellé
 */
const LANGUAGES = [
  { 
    code: 'fr', 
    label: 'Français',
    flag: '🇫🇷',
  },
  { 
    code: 'en', 
    label: 'English',
    flag: '🇬🇧',
  },
  { 
    code: 'es', 
    label: 'Español',
    flag: '🇪🇸',
  },
  { 
    code: 'de', 
    label: 'Deutsch',
    flag: '🇩🇪',
  },
];

/**
 * Composant qui permet de changer la langue de l'application
 * Affiche un bouton avec la langue actuelle et un menu déroulant pour sélectionner une autre langue
 */
const LanguageSwitcher: React.FC = () => {
  // Récupérer le contexte de localisation
  const { locale, changeLocale, t } = useLocale();
  
  // État du menu déroulant
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // Récupérer les informations de la langue actuelle
  const currentLanguage = LANGUAGES.find(lang => lang.code === locale) || LANGUAGES[0];
  
  // Gestionnaires d'événements
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageSelect = (code: string) => {
    changeLocale(code);
    handleClose();
  };
  
  return (
    <Box>
      <Tooltip title={t('change_language') || 'Change language'} arrow>
        <Button
          id="language-button"
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          endIcon={<KeyboardArrowDownIcon />}
          startIcon={<LanguageIcon />}
          color="inherit"
          sx={{ 
            textTransform: 'none', 
            minWidth: 100, 
            justifyContent: 'space-between',
            mr: 1
          }}
        >
          <Box display="flex" alignItems="center">
            <Box component="span" mr={1} fontSize="1.2rem">
              {currentLanguage.flag}
            </Box>
            {currentLanguage.code.toUpperCase()}
          </Box>
        </Button>
      </Tooltip>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        {LANGUAGES.map((language) => (
          <MenuItem 
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            selected={language.code === locale}
            sx={{ 
              minWidth: 180,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box component="span" fontSize="1.2rem">
              {language.flag}
            </Box>
            {language.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher; 