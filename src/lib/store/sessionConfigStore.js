import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSessionConfigStore = create(
  persist(
    (set, get) => ({
      // État temporaire de la configuration
      tempConfig: null,
      
      // Historique des modifications (max 10 états)
      history: [],
      
      // Initialiser une nouvelle configuration
      initConfig: (initialConfig) => {
        set({
          tempConfig: initialConfig,
          history: [{ config: initialConfig, timestamp: new Date() }]
        });
      },
      
      // Mettre à jour la configuration
      updateConfig: (updates) => {
        const currentConfig = get().tempConfig;
        const newConfig = {
          ...currentConfig,
          ...updates
        };
        
        // Ajouter à l'historique
        const history = get().history;
        const newHistory = [
          { config: newConfig, timestamp: new Date() },
          ...history
        ].slice(0, 10); // Garder max 10 états
        
        set({
          tempConfig: newConfig,
          history: newHistory
        });
      },
      
      // Restaurer un état précédent
      restoreFromHistory: (index) => {
        const history = get().history;
        if (history[index]) {
          set({
            tempConfig: history[index].config,
            history: history.slice(index)
          });
        }
      },
      
      // Réinitialiser la configuration
      resetConfig: () => {
        set({
          tempConfig: null,
          history: []
        });
      },
      
      // Valider la configuration
      validateConfig: () => {
        const config = get().tempConfig;
        if (!config) return false;
        
        // Vérifier les champs requis
        const requiredFields = ['settings', 'ai_configuration'];
        for (const field of requiredFields) {
          if (!config[field]) return false;
        }
        
        return true;
      }
    }),
    {
      name: 'session-config-storage',
      getStorage: () => localStorage
    }
  )
); 