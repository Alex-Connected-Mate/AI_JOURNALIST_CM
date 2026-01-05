import { create } from 'zustand';

/**
 * Store global de l'application
 * Version minimaliste pour permettre la compilation
 */
export const useStore = create((set) => ({
  // État pour l'affichage des logs
  showLogs: false,
  // Action pour basculer l'affichage des logs
  toggleLogs: () => set((state) => ({ showLogs: !state.showLogs })),
  
  // Autres états et actions peuvent être ajoutés ici si nécessaire
})); 