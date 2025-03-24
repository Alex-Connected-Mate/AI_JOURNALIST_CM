import React from 'react';

/**
 * Composant de chargement qui affiche un spinner
 * 
 * @param {Object} props
 * @param {boolean} props.fullScreen - Si le loader doit prendre tout l'écran
 */
const Loader = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader; 