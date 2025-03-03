import { create } from 'zustand';

/**
 * Types de logs pour différencier visuellement les messages
 */
export const LogType = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  AUTH: 'auth',
  NAVIGATION: 'navigation',
  API: 'api',
  STATE: 'state',
}

// Stockage non-reactif des logs pour éviter les boucles infinies
let logsArray = [];
const MAX_LOGS = 200;

// Format des logs : {timestamp, type, message, data?}
const useLogStore = create((set, get) => ({
  // Le store zustand ne contient qu'un compteur pour forcer des re-rendus
  // quand on veut explicitement mettre à jour l'UI
  counter: 0,
  
  // Version synchrone qui n'utilise pas set() et évite les mises à jour réactives
  logs: [],
  
  // Ajouter un nouveau log sans déclencher automatiquement de mise à jour UI
  addLog: (type, message, data = null) => {
    const log = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data: data ? JSON.stringify(data) : null,
    };
    
    // Ajouter le log au tableau non-reactif
    logsArray = [log, ...logsArray.slice(0, MAX_LOGS - 1)];
    
    // Afficher dans la console
    console.log(`[${log.type.toUpperCase()}] ${log.message}`, data || '');
    
    // Exposer les logs via get() mais sans déclencher de mise à jour d'état
    return log;
  },
  
  // Explicitement mettre à jour l'UI lorsque nécessaire
  refreshLogs: () => {
    set(state => ({
      counter: state.counter + 1,
      logs: logsArray
    }));
  },
  
  // Effacer tous les logs
  clearLogs: () => {
    logsArray = [];
    set({ counter: 0, logs: [] });
  },
  
  // Obtenir les logs actuels sans passer par zustand
  getCurrentLogs: () => logsArray,
  
  // Obtenir les N derniers logs
  getLastLogs: (count = 10) => {
    return logsArray.slice(0, count);
  },
  
  // Exporter tous les logs au format texte
  exportLogs: (count = null) => {
    const logsToExport = count ? logsArray.slice(0, count) : logsArray;
    
    return logsToExport.map(log => {
      const time = new Date(log.timestamp).toLocaleString();
      return `[${time}][${log.type.toUpperCase()}] ${log.message}${log.data ? ' - Data: ' + log.data : ''}`;
    }).join('\n');
  },
}));

export default useLogStore; 