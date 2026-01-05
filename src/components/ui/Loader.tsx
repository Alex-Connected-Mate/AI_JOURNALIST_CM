import React from 'react';
import { Box, CircularProgress, Typography, styled } from '@mui/material';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

// Conteneur stylisé pour le loader
const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
  width: '100%',
}));

// Conteneur plein écran
const FullScreenContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: theme.palette.background.default,
  zIndex: 9999,
}));

/**
 * Composant Loader réutilisable pour indiquer un chargement
 */
const Loader: React.FC<LoaderProps> = ({ 
  fullScreen = false, 
  message = 'Chargement en cours...' 
}) => {
  const content = (
    <LoaderContainer>
      <CircularProgress 
        size={40}
        thickness={4}
        sx={{ mb: 2 }}
      />
      {message && (
        <Typography 
          variant="body1" 
          color="textSecondary"
          align="center"
        >
          {message}
        </Typography>
      )}
    </LoaderContainer>
  );

  if (fullScreen) {
    return (
      <FullScreenContainer>
        {content}
      </FullScreenContainer>
    );
  }

  return content;
};

export default Loader; 