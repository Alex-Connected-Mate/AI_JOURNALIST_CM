'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function SessionCreationDebugPage() {
  const { sessionCreationLogs, currentSessionCreation } = useStore();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Formater les logs pour l'affichage
  const getFormattedLogs = () => {
    return sessionCreationLogs
      .filter(log => {
        // Filtre par type si un filtre est sélectionné
        if (filterType && log.action !== filterType) return false;
        
        // Filtre par recherche textuelle
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const fieldMatch = log.field?.toLowerCase().includes(searchLower);
          const actionMatch = log.action.toLowerCase().includes(searchLower);
          const messageMatch = log.message?.toLowerCase().includes(searchLower);
          const valueMatch = log.value !== undefined && 
            JSON.stringify(log.value).toLowerCase().includes(searchLower);
            
          return fieldMatch || actionMatch || messageMatch || valueMatch;
        }
        
        return true;
      })
      .map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const id = `${log.timestamp}-${log.action}-${log.field || ''}`;
        return { ...log, formattedTime: time, id };
      });
  };
  
  // Obtenir les types d'actions uniques pour le filtre
  const getUniqueActionTypes = () => {
    const types = new Set<string>();
    sessionCreationLogs.forEach(log => types.add(log.action));
    return Array.from(types).sort();
  };
  
  // Exporter les logs au format JSON
  const exportLogs = () => {
    const dataStr = JSON.stringify(sessionCreationLogs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `session-creation-logs-${new Date().toISOString()}.json`);
    linkElement.click();
  };
  
  // Copier dans le presse-papier
  const copyToClipboard = () => {
    const formattedLogs = sessionCreationLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      let text = `[${time}] [${log.action}]`;
      if (log.step) text += ` STEP: ${log.step}`;
      if (log.field) text += ` FIELD: ${log.field}`;
      if (log.value !== undefined) {
        const valueStr = typeof log.value === 'object' 
          ? JSON.stringify(log.value) 
          : String(log.value);
        text += ` VALUE: ${valueStr.substring(0, 50)}${valueStr.length > 50 ? '...' : ''}`;
      }
      if (log.message) text += ` - ${log.message}`;
      return text;
    }).join('\n');
    
    navigator.clipboard.writeText(formattedLogs)
      .then(() => alert('Logs copiés dans le presse-papier'))
      .catch(err => console.error('Erreur lors de la copie:', err));
  };
  
  // Formater les valeurs complexes
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };
  
  const formattedLogs = getFormattedLogs();
  const actionTypes = getUniqueActionTypes();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Logs de création de session</h1>
      
      {/* État actuel de la création de session */}
      <div className="bg-gray-100 p-4 mb-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">État actuel</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">En cours:</span> {currentSessionCreation.inProgress ? 'Oui' : 'Non'}</p>
            {currentSessionCreation.startedAt && (
              <p><span className="font-medium">Démarré à:</span> {new Date(currentSessionCreation.startedAt).toLocaleString()}</p>
            )}
            <p><span className="font-medium">Étape actuelle:</span> {currentSessionCreation.currentStep || 'N/A'}</p>
          </div>
          <div>
            <p><span className="font-medium">Nombre de logs:</span> {sessionCreationLogs.length}</p>
            <p><span className="font-medium">Champs remplis:</span> {Object.keys(currentSessionCreation.formData).length}</p>
          </div>
        </div>
      </div>
      
      {/* Contrôles */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher dans les logs..."
            className="w-full p-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <select 
            className="w-full p-2 border rounded-md"
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
          >
            <option value="">Tous les types d'actions</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Exporter (JSON)
          </button>
          <button 
            onClick={copyToClipboard}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Copier
          </button>
        </div>
      </div>
      
      {/* Liste des logs */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Heure</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Étape/Champ</th>
              <th className="px-4 py-2 text-left">Message/Valeur</th>
              <th className="px-4 py-2 text-left">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {formattedLogs.length > 0 ? (
              formattedLogs.map((log, index) => (
                <>
                  <tr 
                    key={log.id} 
                    className={`hover:bg-gray-50 ${
                      log.action.includes('error') ? 'bg-red-50' : 
                      log.action.includes('success') ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-sm">{log.formattedTime}</td>
                    <td className="px-4 py-2">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium 
                        ${log.action.includes('error') ? 'bg-red-100 text-red-800' : 
                          log.action === 'field_update' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'step_change' ? 'bg-purple-100 text-purple-800' :
                          log.action.includes('success') ? 'bg-green-100 text-green-800' :
                          log.action.includes('profile') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {log.step && <div className="text-sm font-medium">{log.step}</div>}
                      {log.field && <div className="text-sm text-gray-600">{log.field}</div>}
                    </td>
                    <td className="px-4 py-2">
                      {log.message && <div className="text-sm">{log.message}</div>}
                      {log.value !== undefined && (
                        <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                          {typeof log.value === 'object' 
                            ? JSON.stringify(log.value).substring(0, 30) + '...' 
                            : String(log.value).substring(0, 30) + (String(log.value).length > 30 ? '...' : '')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedLog === log.id ? 'Masquer' : 'Voir'}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Détails du log étendu */}
                  {expandedLog === log.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 bg-gray-50">
                        <div className="text-sm">
                          <h3 className="font-medium mb-2">Détails complets</h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p><span className="font-medium">Timestamp:</span> {log.timestamp}</p>
                              <p><span className="font-medium">Action:</span> {log.action}</p>
                              {log.step && <p><span className="font-medium">Étape:</span> {log.step}</p>}
                              {log.field && <p><span className="font-medium">Champ:</span> {log.field}</p>}
                              {log.message && <p><span className="font-medium">Message:</span> {log.message}</p>}
                            </div>
                            
                            <div>
                              {log.value !== undefined && (
                                <div>
                                  <p className="font-medium mb-1">Valeur:</p>
                                  <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs max-h-32">
                                    {formatValue(log.value)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.details && (
                                <div className="mt-2">
                                  <p className="font-medium mb-1">Détails supplémentaires:</p>
                                  <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs max-h-32">
                                    {formatValue(log.details)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucun log trouvé. Essayez de créer une session pour générer des logs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Informations actuelles sur les champs */}
      {Object.keys(currentSessionCreation.formData).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Données du formulaire actuel</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(currentSessionCreation.formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 