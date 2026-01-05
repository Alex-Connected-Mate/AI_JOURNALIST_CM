import React from 'react';
import { Container, Box, Typography, Button, Paper, Grid } from '@mui/material';
import { useLocale } from '../components/LocaleProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Page d'accueil simple de l'application
 */
export default function Home() {
  const { t } = useLocale();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Header />
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          flex: '1 0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 6
        }}
      >
        <Box
          component="main"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography 
            component="h1" 
            variant="h2" 
            sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}
          >
            {t('welcome')}
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ mb: 4, maxWidth: 800, textAlign: 'center' }}
          >
            {t('app_description') || 'AI Journalist for Connected Mate'}
          </Typography>
          
          <Grid container spacing={4} maxWidth="md" sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <Typography variant="h4" sx={{ mb: 2 }}>
                  {t('login_title') || 'Already a user?'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                  {t('login_description') || 'Login to your account and continue your work'}
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  href="/login"
                  sx={{ minWidth: 180 }}
                >
                  {t('login')}
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <Typography variant="h4" sx={{ mb: 2 }}>
                  {t('register_title') || 'New to the platform?'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                  {t('register_description') || 'Create a new account to get started'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="large"
                  href="/register"
                  sx={{ minWidth: 180 }}
                >
                  {t('register') || 'Sign up'}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
      
      <Footer />
    </Box>
  );
} 