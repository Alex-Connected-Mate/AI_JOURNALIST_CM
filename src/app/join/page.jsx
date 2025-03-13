'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import DotPattern from '@/components/ui/DotPattern'; 
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function JoinSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  
  const [sessionCode, setSessionCode] = useState(codeFromUrl || '');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);

  // Vérifier si on a un code dans l'URL au chargement
  useEffect(() => {
    if (codeFromUrl) {
      // Focus automatiquement sur le champ nom si un code est déjà présent
      document.getElementById('display-name')?.focus();
    }
  }, [codeFromUrl]);

  // Initialiser le scanner quand showScanner devient true
  useEffect(() => {
    let scanner;
    
    if (showScanner && !scannerInitialized) {
      setScannerInitialized(true);
      
      // Initialiser le scanner QR code
      scanner = new Html5QrcodeScanner('qr-reader', 
        { 
          fps: 10, 
          qrbox: 250,
          rememberLastUsedCamera: true,
          supportedScanTypes: [0] // QRCode only
        }, 
        false // ne pas commencer immédiatement
      );
      
      scanner.render((decodedText) => {
        // Gérer le résultat du scan
        handleQrScanned(decodedText);
        setShowScanner(false);
      }, (error) => {
        console.warn(`Code scan error = ${error}`);
      });
      
      // Démarrer après rendu
      setTimeout(() => {
        const startButton = document.getElementById('qr-reader__start-button');
        if (startButton) startButton.click();
      }, 100);
    }
    
    // Cleanup
    return () => {
      if (scanner && showScanner === false && scannerInitialized) {
        scanner.clear();
        setScannerInitialized(false);
      }
    };
  }, [showScanner, scannerInitialized]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await joinSession();
  };
  
  const handleQrScanned = (scannedCode) => {
    // Extraire le code de session du QR si c'est une URL
    let extractedCode = scannedCode;
    
    try {
      const url = new URL(scannedCode);
      // Si le QR contient une URL, chercher le dernier segment
      if (url.pathname.includes('/join/')) {
        // Extraire le code du chemin /join/CODE
        const pathParts = url.pathname.split('/');
        extractedCode = pathParts[pathParts.length - 1];
      }
    } catch (e) {
      // Ce n'est pas une URL valide, on utilise le contenu brut
      console.log('Code scanné non-URL:', scannedCode);
    }
    
    setSessionCode(extractedCode);
    setShowScanner(false);
  };

  const joinSession = async () => {
    if (!sessionCode.trim()) {
      setError('Le code de session est requis');
      return;
    }

    if (!displayName.trim()) {
      setError('Votre nom est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Vérifier d'abord si la session existe
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, status, max_participants, code')
        .or(`code.eq.${sessionCode.trim()},session_code.eq.${sessionCode.trim()}`)
        .single();
      
      if (sessionError) {
        if (sessionError.code === '42P01') {
          console.error("La table 'sessions' n'existe pas dans la base de données:", sessionError);
          setError("La base de données n'est pas correctement configurée. La table 'sessions' est manquante. Veuillez suivre les instructions dans DATABASE_SETUP.md pour configurer la base de données.");
          setLoading(false);
          return;
        }
        
        setError('Session introuvable avec ce code');
        setLoading(false);
        return;
      }
      
      if (!sessionData) {
        setError('Session introuvable avec ce code');
        setLoading(false);
        return;
      }
      
      if (sessionData.status !== 'active' && sessionData.status !== 'draft') {
        setError('Cette session n\'est pas active actuellement');
        setLoading(false);
        return;
      }
      
      try {
        // Vérifier le nombre actuel de participants
        const { count, error: countError } = await supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', sessionData.id);
          
        if (countError) {
          if (countError.code === '42P01') {
            console.error("La table 'participants' n'existe pas dans la base de données:", countError);
            setError("La base de données n'est pas correctement configurée. La table 'participants' est manquante. Veuillez suivre les instructions dans DATABASE_SETUP.md pour configurer la base de données.");
            setLoading(false);
            return;
          }
          throw countError;
        }
        
        // Vérifier si la session est pleine
        if (count >= (sessionData.max_participants || 30)) {
          setError(`Cette session est pleine (maximum ${sessionData.max_participants || 30} participants)`);
          setLoading(false);
          return;
        }
        
        // Créer un ID anonyme unique pour ce participant
        const anonymousId = `anon_${Math.random().toString(36).substring(2, 15)}`;
        
        // Créer un participant anonyme
        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .insert([
            { 
              session_id: sessionData.id, 
              name: displayName.trim(),
              anonymous_id: anonymousId,
              is_presenter: false,
              status: 'active',
              device_info: { 
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              }
            }
          ])
          .select()
          .single();
          
        if (participantError) {
          if (participantError.code === '42P01') {
            console.error("La table 'participants' n'existe pas dans la base de données:", participantError);
            setError("La base de données n'est pas correctement configurée. La table 'participants' est manquante. Veuillez suivre les instructions dans DATABASE_SETUP.md pour configurer la base de données.");
            setLoading(false);
            return;
          }
          throw participantError;
        }
        
        // Sauvegarder les informations du participant dans le localStorage
        localStorage.setItem(`participant_${sessionData.id}`, JSON.stringify(participantData));
        
        // Rediriger vers la page de participation
        setSuccess(true);
        setTimeout(() => {
          router.push(`/sessions/${sessionData.id}/participate?name=${encodeURIComponent(displayName.trim())}`);
        }, 1500);
        
      } catch (err) {
        console.error("Erreur lors de l'accès à la table participants:", err);
        setError(`Erreur lors de la tentative de rejoindre la session: ${err.message || 'Erreur inconnue'}`);
      }
    } catch (err) {
      console.error("Erreur lors de l'accès à la base de données:", err);
      setError(`Erreur inattendue: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 relative">
      <DotPattern className="absolute inset-0 z-0" />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md relative z-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Rejoindre une session</h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez le code de session ou scannez le QR code
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Aucun compte n'est requis pour participer
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            Vous avez rejoint la session avec succès! Redirection en cours...
          </div>
        )}

        {showScanner ? (
          <div className="mt-6">
            <div id="qr-reader" style={{ width: '100%' }}></div>
            <button 
              type="button"
              onClick={() => setShowScanner(false)}
              className="mt-4 w-full flex justify-center py-2 px-4 cm-button-secondary"
            >
              Annuler le scan
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="session-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Code de session
                </label>
                <div className="relative">
                  <input
                    id="session-code"
                    name="sessionCode"
                    type="text"
                    autoComplete="off"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="ABC123"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
                    aria-label="Scanner un QR code"
                    title="Scanner un QR code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Votre nom
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Jean Dupont"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 cm-button"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement...
                  </span>
                ) : (
                  'Rejoindre la session'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm mt-4">
          <Link href="/" className="text-primary hover:text-primary/90">
            Retour à l'accueil
          </Link>
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>Clipboard by ConnectedMate</p>
        </div>
      </div>
    </div>
  );
} 