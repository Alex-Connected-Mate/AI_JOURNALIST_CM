import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  useMediaQuery,
  useTheme,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLocale } from './LocaleProvider';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Composant d'en-tête de l'application
 * Gère la navigation, le menu utilisateur et l'adaptation responsive
 */
const Header: React.FC = () => {
  const { t } = useLocale();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const session = useSession();
  const supabase = useSupabaseClient();
  
  // États pour les menus et tiroirs
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchor);
  
  // Déterminer si l'utilisateur est connecté
  const isLoggedIn = !!session;
  
  // Gestionnaires d'événements
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = async () => {
    handleUserMenuClose();
    await supabase.auth.signOut();
    router.push('/');
  };
  
  const navigateTo = (path: string) => {
    router.push(path);
    handleUserMenuClose();
    setMobileMenuOpen(false);
  };
  
  // Liens de navigation
  const navLinks = [
    { 
      title: t('dashboard') || 'Dashboard', 
      path: '/dashboard',
      icon: <DashboardIcon />,
      requireAuth: true 
    },
    { 
      title: t('articles') || 'Articles', 
      path: '/articles',
      icon: <ArticleIcon />,
      requireAuth: true 
    },
    { 
      title: t('settings') || 'Settings', 
      path: '/settings',
      icon: <SettingsIcon />,
      requireAuth: true 
    },
  ];
  
  // Filtrer les liens en fonction du statut de connexion
  const filteredNavLinks = navLinks.filter(link => 
    (link.requireAuth && isLoggedIn) || (!link.requireAuth)
  );
  
  // Menu utilisateur
  const renderUserMenu = () => (
    <Menu
      anchorEl={userMenuAnchor}
      id="user-menu"
      open={userMenuOpen}
      onClose={handleUserMenuClose}
      PaperProps={{
        elevation: 3,
        sx: { minWidth: 180 }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => navigateTo('/profile')}>
        <ListItemIcon>
          <AccountCircleIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('profile') || 'Profile'}</ListItemText>
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <ExitToAppIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('logout')}</ListItemText>
      </MenuItem>
    </Menu>
  );
  
  // Menu mobile (drawer)
  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box sx={{ width: 250 }} role="presentation">
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="h6" component="div">
            Connected Mate
          </Typography>
        </Box>
        
        <List>
          {filteredNavLinks.map((link) => (
            <ListItemButton 
              key={link.path} 
              onClick={() => navigateTo(link.path)}
              selected={router.pathname === link.path}
            >
              <ListItemIcon>{link.icon}</ListItemIcon>
              <ListItemText primary={link.title} />
            </ListItemButton>
          ))}
          
          {isLoggedIn ? (
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon><ExitToAppIcon /></ListItemIcon>
              <ListItemText primary={t('logout')} />
            </ListItemButton>
          ) : (
            <>
              <ListItemButton onClick={() => navigateTo('/login')}>
                <ListItemText primary={t('login')} />
              </ListItemButton>
              <ListItemButton onClick={() => navigateTo('/register')}>
                <ListItemText primary={t('register')} />
              </ListItemButton>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
  
  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Link href="/" passHref>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                flexGrow: 1, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Connected Mate
            </Typography>
          </Link>
          
          {/* Navigation pour desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {filteredNavLinks.map((link) => (
                <Button
                  key={link.path}
                  color="inherit"
                  onClick={() => navigateTo(link.path)}
                  sx={{ 
                    mx: 1,
                    ...(router.pathname === link.path && {
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                    })
                  }}
                >
                  {link.title}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LanguageSwitcher />
            
            {isLoggedIn ? (
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                color="inherit"
              >
                <Avatar 
                  sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}
                >
                  {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            ) : (
              !isMobile && (
                <Box sx={{ display: 'flex' }}>
                  <Button 
                    color="inherit" 
                    onClick={() => navigateTo('/login')}
                    sx={{ ml: 1 }}
                  >
                    {t('login')}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigateTo('/register')}
                    sx={{ ml: 1 }}
                  >
                    {t('register')}
                  </Button>
                </Box>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {renderUserMenu()}
      {renderMobileDrawer()}
    </>
  );
};

export default Header; 