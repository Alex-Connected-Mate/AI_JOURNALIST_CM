'use client';

import React, { useState, useEffect } from 'react';
const { useRouter } = require('next/navigation');
const Link = require('next/link');
const { useStore } = require('@/lib/store');
const SessionCreationFlow = require('@/components/SessionCreationFlow');
const { getSessionById, updateSession } = require('@/lib/supabase');
const { toast } = require('react-hot-toast');

module.exports = function EditSessionPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user, userProfile } = useStore();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatedSession, setUpdatedSession] = useState({});
  
  // Load session data
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch the session data from Supabase
        const { data, error } = await getSessionById(sessionId);
        
        if (error) throw error;
        if (!data) throw new Error('Session not found');
        
        console.log('Loaded session data:', data);
        setSession(data);

      } catch (err) {
        console.error('Error loading session:', err);
        setError('Unable to load session data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, user]);
  
  // Handle saving changes
  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('[Edit Session] Saving session with data:', updatedSession);
      
      // Si aucune modification n'a été apportée, afficher un message et terminer
      if (Object.keys(updatedSession).length === 0) {
        toast.info('Aucune modification n\'a été détectée.');
        setSaving(false);
        return;
      }
      
      // Notification de sauvegarde en cours
      const saveToastId = toast.loading('Sauvegarde de la session en cours...');
      
      // Créer un objet unifié qui combine les données existantes avec les mises à jour
      const sessionToSave = {
        ...session,                 // Inclure toutes les données de session existantes
        ...updatedSession,          // Ajouter les changements de niveau racine
        
        // Assurer que les champs critiques sont toujours présents aux deux niveaux
        title: updatedSession.title || session.title,
        name: updatedSession.title || session.title,   // Synchroniser name avec title
        
        // Synchroniser les champs entre la racine et settings
        institution: updatedSession.institution || session.institution,
        professor_name: updatedSession.professor_name || session.professor_name,
        show_professor_name: updatedSession.show_professor_name !== undefined 
          ? updatedSession.show_professor_name 
          : session.show_professor_name,
        max_participants: updatedSession.max_participants || session.max_participants,
        
        // Fusionner les settings plutôt que de les remplacer
        settings: {
          ...session.settings,                        // Garder tous les paramètres existants
          ...(updatedSession.settings || {}),         // Ajouter les mises à jour des settings
          
          // Synchroniser les champs critiques dans settings
          institution: updatedSession.institution || session.institution || 
                     (updatedSession.settings?.institution || session.settings?.institution),
          professorName: updatedSession.professor_name || session.professor_name || 
                       (updatedSession.settings?.professorName || session.settings?.professorName),
          showProfessorName: updatedSession.show_professor_name !== undefined 
            ? updatedSession.show_professor_name 
            : (session.show_professor_name !== undefined 
                ? session.show_professor_name 
                : (updatedSession.settings?.showProfessorName !== undefined 
                    ? updatedSession.settings.showProfessorName 
                    : session.settings?.showProfessorName)),
          maxParticipants: updatedSession.max_participants || session.max_participants || 
                         (updatedSession.settings?.maxParticipants || session.settings?.maxParticipants),
        }
      };

      // Assurer que les paramètres de la configuration AI sont préservés
      if (updatedSession.settings?.ai_configuration || session.settings?.ai_configuration) {
        sessionToSave.settings.ai_configuration = {
          ...(session.settings?.ai_configuration || {}),
          ...(updatedSession.settings?.ai_configuration || {})
        };
      }
      
      // Assurer que les paramètres de connexion sont préservés
      if (updatedSession.settings?.connection || session.settings?.connection) {
        sessionToSave.settings.connection = {
          ...(session.settings?.connection || {}),
          ...(updatedSession.settings?.connection || {})
        };
      }
      
      console.log('[Edit Session] Prepared session data for save:', sessionToSave);
      
      const { data, error } = await updateSession(session.id, sessionToSave);
      
      if (error) {
        console.error('[Edit Session] Error updating session:', error);
        toast.error(`Échec de la mise à jour: ${error.message}`, {
          id: saveToastId
        });
      } else {
        console.log('[Edit Session] Session updated successfully:', data);
        toast.success('Session mise à jour avec succès!', {
          id: saveToastId,
          icon: '✅',
          duration: 3000
        });
        
        // Mettre à jour l'état de la session avec les données mises à jour
        setSession(data);
        setUpdatedSession({});
        
        // Attendre un peu pour que l'utilisateur voie le message de succès
        setTimeout(() => {
          // Naviguer vers une autre page ou rester sur la même page selon votre flux
        }, 1000);
      }
    } catch (err) {
      console.error('[Edit Session] Exception during save:', err);
      toast.error(`Une erreur inattendue s'est produite: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/dashboard" 
            className="cm-button w-full flex justify-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Session Not Found</h1>
          <p className="text-gray-700 mb-6">The session you're looking for could not be found.</p>
          <Link 
            href="/dashboard" 
            className="cm-button w-full flex justify-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Prepare the initial config for SessionCreationFlow
  const initialConfig = {
    title: session.title || session.name,
    description: session.description,
    institution: session.institution || userProfile?.institution || (session.settings?.institution),
    professorName: session.professor_name || (session.settings?.professorName),
    showProfessorName: session.show_professor_name !== undefined ? session.show_professor_name : (session.settings?.showProfessorName),
    maxParticipants: session.max_participants || (session.settings?.maxParticipants) || 30,
    useProfileAvatar: session.use_profile_avatar !== undefined ? session.use_profile_avatar : false,
    companyLogo: session.company_logo || null,
    // Add timer settings if they exist
    timerEnabled: session.settings?.ai_configuration?.timerEnabled !== undefined
      ? session.settings.ai_configuration.timerEnabled
      : false,
    timerDuration: session.settings?.ai_configuration?.timerDuration || 5,
    ...session.settings,
  };
  
  console.log("Session config for editing:", initialConfig);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Edit Session</h1>
            <div className="flex items-center gap-2">
              <Link
                href={`/sessions/${sessionId}`}
                className="cm-button-secondary"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="cm-button flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <SessionCreationFlow 
            initialConfig={initialConfig}
            onSubmit={handleSave}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
} 