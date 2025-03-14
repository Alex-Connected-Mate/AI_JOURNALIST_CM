'use client';

import React, { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page de diagnostics et d'administration système
 * Adaptée pour fonctionner sur Vercel
 * 
 * Cette page permet de :
 * - Visualiser l'état de l'application
 * - Détecter les problèmes courants
 * - Déclencher des corrections via des API routes
 */

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}

function DiagnosticsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState({});
  const [diagnosticResults, setDiagnosticResults] = useState([]);
  const [autoFixStatus, setAutoFixStatus] = useState(null);
  const [fixRunning, setFixRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [logs, setLogs] = useState([]);
  const [deployInfo, setDeployInfo] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionCodeFixStatus, setSessionCodeFixStatus] = useState(null);
  const [sessionCodeFixResult, setSessionCodeFixResult] = useState(null);
  
  // Chargement des informations système au montage
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        // Récupérer les informations système via une API route
        const response = await fetch('/api/admin/system-info');
        const data = await response.json();
        
        setSystemInfo({
          nextVersion: data.nextVersion || 'Next.js 15.2.0',
          nodeVersion: data.nodeVersion || 'v18.x',
          environment: data.environment || process.env.NODE_ENV,
          buildTime: data.buildTime || new Date().toISOString(),
          lastDeployment: data.lastDeployment || 'Inconnu',
          vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'
        });
        
        // Récupérer les résultats de diagnostic
        const diagResponse = await fetch('/api/admin/diagnostics');
        const diagData = await diagResponse.json();
        
        setDiagnosticResults(diagData.results || []);
        
        // Récupérer les logs récents
        const logsResponse = await fetch('/api/admin/logs');
        const logsData = await logsResponse.json();
        
        setLogs(logsData.logs || []);
        
        // Récupérer les infos de déploiement Vercel
        try {
          const deployResponse = await fetch('/api/admin/deployment-info');
          const deployData = await deployResponse.json();
          setDeployInfo(deployData);
        } catch (e) {
          console.error('Erreur lors de la récupération des informations de déploiement', e);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        
        // Données de fallback en cas d'erreur
        setSystemInfo({
          nextVersion: 'Next.js 15.2.0',
          nodeVersion: 'v18.x',
          environment: process.env.NODE_ENV,
          buildTime: new Date().toISOString(),
          lastDeployment: 'Inconnu',
          vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'
        });
        
        setDiagnosticResults([
          { 
            name: 'API de diagnostic inaccessible', 
            status: 'error',
            message: 'Impossible de récupérer les diagnostics. Vérifiez que les API routes sont correctement déployées.'
          }
        ]);
        
        setLogs([
          {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: 'Erreur lors de la récupération des données: ' + error.message
          }
        ]);
        
        setLoading(false);
      }
    };
    
    fetchSystemInfo();
  }, []);
  
  // Fonction pour lancer la correction automatique des problèmes
  const handleAutoFix = async () => {
    setFixRunning(true);
    setAutoFixStatus('running');
    
    try {
      // Appeler l'API de correction
      const response = await fetch('/api/admin/auto-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fixNextConfig: true,
          fixInputComponents: true,
          fixJsonErrors: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAutoFixStatus('success');
        // Mettre à jour les résultats après la correction
        setDiagnosticResults(prev => prev.map(result => ({
          ...result,
          status: 'success',
          message: `${result.name} a été corrigé avec succès.`
        })));
      } else {
        setAutoFixStatus('error');
        console.error('Erreur lors de la correction:', data.error);
      }
    } catch (error) {
      console.error('Erreur lors de la correction automatique:', error);
      setAutoFixStatus('error');
    } finally {
      setFixRunning(false);
    }
  };
  
  // Fonction pour corriger les codes de session manquants
  const handleFixSessionCodes = async () => {
    setSessionCodeFixStatus('running');
    setSessionCodeFixResult(null);
    
    try {
      // Appeler l'API de correction des codes de session
      const response = await fetch('/api/admin/fix-session-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionCodeFixStatus('success');
        setSessionCodeFixResult(data);
        
        // Mettre à jour les résultats de diagnostic
        const updatedResults = [...diagnosticResults];
        const sessionCodeIndex = updatedResults.findIndex(r => 
          r.name === 'Sessions avec codes manquants' || 
          r.name.includes('session') && r.name.includes('code')
        );
        
        if (sessionCodeIndex >= 0) {
          updatedResults[sessionCodeIndex] = {
            ...updatedResults[sessionCodeIndex],
            status: data.fixedCount > 0 ? 'success' : 'warning',
            message: data.fixedCount > 0 
              ? `${data.fixedCount} sessions ont été corrigées avec succès.` 
              : 'Aucune session avec des codes manquants n\'a été trouvée.'
          };
          setDiagnosticResults(updatedResults);
        }
      } else {
        setSessionCodeFixStatus('error');
        setSessionCodeFixResult(data);
        console.error('Erreur lors de la correction des codes de session:', data.message);
      }
    } catch (error) {
      console.error('Erreur lors de la correction des codes de session:', error);
      setSessionCodeFixStatus('error');
      setSessionCodeFixResult({
        success: false,
        message: error.message || 'Erreur inconnue'
      });
    }
  };
  
  // Fonction pour déclencher un nouveau déploiement sur Vercel
  const triggerNewDeployment = async () => {
    try {
      const response = await fetch('/api/admin/trigger-deployment', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Nouveau déploiement déclenché avec succès. Il sera actif dans quelques minutes.');
      } else {
        alert('Erreur lors du déclenchement du déploiement: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du déclenchement du déploiement.');
    }
  };
  
  // Gestionnaire pour télécharger les logs
  const handleDownloadLogs = async () => {
    try {
      const response = await fetch('/api/admin/download-logs');
      const blob = await response.blob();
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'application-logs.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement des logs:', error);
      alert('Erreur lors du téléchargement des logs.');
    }
  };
  
  // Gestionnaire pour vider les logs
  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/admin/clear-logs', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLogs([]);
        alert('Logs vidés avec succès.');
      } else {
        alert('Erreur lors du vidage des logs: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du vidage des logs.');
    }
  };
  
  // Fonction pour copier les logs dans le presse-papiers
  const handleCopyLogs = async () => {
    try {
      // Formater les logs en JSON avec indentation
      const formattedLogs = JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: systemInfo.environment,
        vercelEnv: systemInfo.vercelEnv,
        nextVersion: systemInfo.nextVersion,
        logs: logs.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message
        }))
      }, null, 2);

      // Copier dans le presse-papiers
      await navigator.clipboard.writeText(formattedLogs);
      
      // Afficher le feedback de succès
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie des logs:', error);
      alert('Erreur lors de la copie des logs dans le presse-papiers.');
    }
  };
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Diagnostics du système
        {systemInfo.vercelEnv && (
          <span className={`ml-3 text-sm px-2 py-1 rounded ${
            systemInfo.vercelEnv === 'production' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {systemInfo.vercelEnv.toUpperCase()}
          </span>
        )}
      </h1>
      
      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('system')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informations système
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'diagnostics'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Logs système
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'deployment'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Déploiement
          </button>
        </nav>
      </div>
      
      {/* Contenu de l'onglet actif */}
      {activeTab === 'system' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Informations système</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Version Next.js</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.nextVersion}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Version Node.js</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.nodeVersion}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Environnement</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.environment}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">URL de déploiement</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <a 
                  href="https://ai-journalist-connectedmate.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800"
                >
                  ai-journalist-connectedmate.vercel.app
                </a>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Heure de build</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.buildTime}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Dernier déploiement</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.lastDeployment}</dd>
            </div>
          </dl>
        </div>
      )}
      
      {activeTab === 'diagnostics' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Résultats de diagnostic</h2>
          
          {autoFixStatus && (
            <div className={`mb-4 p-4 rounded-md ${
              autoFixStatus === 'running' ? 'bg-blue-50 text-blue-700' :
              autoFixStatus === 'success' ? 'bg-green-50 text-green-700' : 
              'bg-red-50 text-red-700'
            }`}>
              {autoFixStatus === 'running' && 'Correction automatique en cours...'}
              {autoFixStatus === 'success' && 'Correction automatique terminée avec succès.'}
              {autoFixStatus === 'error' && 'Erreur lors de la correction automatique.'}
            </div>
          )}
          
          {sessionCodeFixStatus && (
            <div className={`mb-4 p-4 rounded-md ${
              sessionCodeFixStatus === 'running' ? 'bg-blue-50 text-blue-700' :
              sessionCodeFixStatus === 'success' ? 'bg-green-50 text-green-700' : 
              'bg-red-50 text-red-700'
            }`}>
              {sessionCodeFixStatus === 'running' && 'Correction des codes de session en cours...'}
              {sessionCodeFixStatus === 'success' && (
                <div>
                  <p>Correction des codes de session terminée avec succès.</p>
                  {sessionCodeFixResult && (
                    <p className="mt-1 text-sm">
                      {sessionCodeFixResult.fixedCount} session(s) corrigée(s).
                    </p>
                  )}
                </div>
              )}
              {sessionCodeFixStatus === 'error' && (
                <div>
                  <p>Erreur lors de la correction des codes de session.</p>
                  {sessionCodeFixResult && (
                    <p className="mt-1 text-sm">{sessionCodeFixResult.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <ul className="space-y-4">
            {diagnosticResults.map((result, index) => (
              <li 
                key={index} 
                className={`border-l-4 p-4 shadow-sm rounded-md bg-gray-50 ${
                  result.status === 'success' 
                    ? 'border-green-500' 
                    : result.status === 'warning' 
                      ? 'border-yellow-500' 
                      : 'border-red-500'
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                    result.status === 'success' 
                      ? 'bg-green-500' 
                      : result.status === 'warning' 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{result.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 space-y-4">
            <button
              onClick={handleAutoFix}
              disabled={fixRunning}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                fixRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {fixRunning ? 'Correction en cours...' : 'Corriger automatiquement les problèmes'}
            </button>
            
            <button
              onClick={handleFixSessionCodes}
              disabled={sessionCodeFixStatus === 'running'}
              className={`block px-4 py-2 rounded-md text-white font-medium ${
                sessionCodeFixStatus === 'running'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {sessionCodeFixStatus === 'running' 
                ? 'Correction des codes en cours...' 
                : 'Corriger les codes de session manquants'}
            </button>
            
            <p className="mt-2 text-sm text-gray-500">
              Note: Certaines corrections peuvent nécessiter un nouveau déploiement pour prendre effet.
            </p>
          </div>
        </div>
      )}
      
      {activeTab === 'logs' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Logs système</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLogs}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  copySuccess 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {copySuccess ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copié !
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copier les logs
                  </span>
                )}
              </button>
              <button 
                onClick={handleDownloadLogs}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 text-sm font-medium"
              >
                Télécharger
              </button>
              <button 
                onClick={handleClearLogs}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700 text-sm font-medium"
              >
                Vider
              </button>
            </div>
          </div>
          
          <div className="bg-gray-900 text-gray-300 p-4 rounded-md font-mono text-sm h-80 overflow-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <p key={index} className={`${
                  log.level === 'ERROR' ? 'text-red-400' :
                  log.level === 'WARN' ? 'text-yellow-400' :
                  log.level === 'INFO' ? 'text-blue-400' :
                  'text-gray-400'
                }`}>
                  {log.timestamp} [{log.level}] {log.message}
                </p>
              ))
            ) : (
              <p className="text-gray-500 italic">Aucun log disponible</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'deployment' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Gestion du déploiement</h2>
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Informations de déploiement</h3>
            {deployInfo ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">ID du déploiement</dt>
                  <dd className="mt-1 text-sm text-gray-900">{deployInfo.id || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Date de déploiement</dt>
                  <dd className="mt-1 text-sm text-gray-900">{deployInfo.createdAt || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">État</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      deployInfo.status === 'ready' ? 'bg-green-100 text-green-800' :
                      deployInfo.status === 'building' ? 'bg-blue-100 text-blue-800' :
                      deployInfo.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {deployInfo.status || 'Inconnu'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Branche</dt>
                  <dd className="mt-1 text-sm text-gray-900">{deployInfo.meta?.gitBranch || 'N/A'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Les informations de déploiement ne sont pas disponibles.
              </p>
            )}
          </div>
          
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium mb-2">Actions de déploiement</h3>
            <p className="text-sm text-gray-600 mb-4">
              Les actions ci-dessous affectent directement votre application en production. 
              Utilisez-les avec précaution.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={triggerNewDeployment}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium"
              >
                Déclencher un nouveau déploiement
              </button>
              
              <div>
                <a 
                  href="https://vercel.com/connectedmate/ai-journalist-connectedmate" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 inline-block"
                >
                  Ouvrir le tableau de bord Vercel
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiagnosticsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosticsContent />
    </Suspense>
  );
} 