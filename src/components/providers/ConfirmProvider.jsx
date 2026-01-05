import React, { createContext, useContext, useState } from 'react';

// Création du contexte
const ConfirmContext = createContext(null);

/**
 * Hook pour utiliser le contexte de confirmation
 */
export const useConfirm = () => useContext(ConfirmContext);

/**
 * Provider pour les confirmations modales
 * Version minimaliste pour permettre la compilation
 */
export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Fonction pour ouvrir la modal de confirmation
  const confirm = (message, onConfirm, onCancel = () => {}) => {
    setState({ isOpen: true, message, onConfirm, onCancel });
    return new Promise((resolve) => {
      const onConfirmWrapped = () => {
        resolve(true);
        onConfirm();
      };
      const onCancelWrapped = () => {
        resolve(false);
        onCancel();
      };
      setState({ isOpen: true, message, onConfirm: onConfirmWrapped, onCancel: onCancelWrapped });
    });
  };

  // Fonction pour fermer la modal et annuler
  const handleCancel = () => {
    state.onCancel();
    setState({ ...state, isOpen: false });
  };

  // Fonction pour fermer la modal et confirmer
  const handleConfirm = () => {
    state.onConfirm();
    setState({ ...state, isOpen: false });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
    </ConfirmContext.Provider>
  );
}; 