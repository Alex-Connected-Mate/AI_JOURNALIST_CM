import React from 'react';
import { Box, Container, Typography, Grid, Link, Divider, useTheme } from '@mui/material';
import { useLocale } from './LocaleProvider';

/**
 * Composant de pied de page pour l'application
 * Inclut des liens utiles, informations légales et copyright
 */
const Footer: React.FC = () => {
  const { t } = useLocale();
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  // Liens à afficher dans le footer
  const footerLinks = [
    {
      title: t('about') || 'About',
      links: [
        { name: t('about_us') || 'About Us', url: '/about' },
        { name: t('contact') || 'Contact', url: '/contact' },
        { name: t('careers') || 'Careers', url: '/careers' },
        { name: t('blog') || 'Blog', url: '/blog' },
      ]
    },
    {
      title: t('products') || 'Products',
      links: [
        { name: t('journalist_ai') || 'Journalist AI', url: '/products/journalist' },
        { name: t('content_analyzer') || 'Content Analyzer', url: '/products/analyzer' },
        { name: t('research_assistant') || 'Research Assistant', url: '/products/research' },
      ]
    },
    {
      title: t('resources') || 'Resources',
      links: [
        { name: t('documentation') || 'Documentation', url: '/docs' },
        { name: t('help_center') || 'Help Center', url: '/help' },
        { name: t('tutorials') || 'Tutorials', url: '/tutorials' },
      ]
    },
    {
      title: t('legal') || 'Legal',
      links: [
        { name: t('terms') || 'Terms', url: '/terms' },
        { name: t('privacy') || 'Privacy', url: '/privacy' },
        { name: t('cookies') || 'Cookies', url: '/cookies' },
      ]
    },
  ];
  
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Logo et description */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Connected Mate
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('footer_description') || 'AI-powered journalism tools to create high-quality content quickly and efficiently.'}
            </Typography>
          </Grid>
          
          {/* Liens */}
          {footerLinks.map((category) => (
            <Grid item xs={6} sm={3} md={2} key={category.title}>
              <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold">
                {category.title}
              </Typography>
              <Box>
                {category.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.url}
                    color="text.secondary"
                    display="block"
                    variant="body2"
                    sx={{ 
                      mb: 1,
                      textDecoration: 'none',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
        
        {/* Ligne de séparation */}
        <Divider sx={{ my: 4 }} />
        
        {/* Copyright et notes de bas de page */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'flex-start' } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 0 } }}>
            © {currentYear} Connected Mate. {t('all_rights_reserved') || 'All rights reserved.'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="#" variant="body2" color="text.secondary" sx={{ textDecoration: 'none' }}>
              {t('terms_of_service') || 'Terms of Service'}
            </Link>
            <Link href="#" variant="body2" color="text.secondary" sx={{ textDecoration: 'none' }}>
              {t('privacy_policy') || 'Privacy Policy'}
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 