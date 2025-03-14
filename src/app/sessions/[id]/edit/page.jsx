'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import { getSessionById, updateSession } from '@/lib/supabase';

export default function EditSessionPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user, userProfile } = useStore();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
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
  const handleSave = async (updatedSession) => {
    try {
      setSaving(true);
      
      // Prepare the updated session data with the new fields
      const sessionToSave = {
        ...session,
        ...updatedSession,
        // Make sure the new fields are included if they exist in the updatedSession
        use_profile_avatar: updatedSession.use_profile_avatar !== undefined 
          ? updatedSession.use_profile_avatar 
          : session.use_profile_avatar,
        company_logo: updatedSession.company_logo || session.company_logo,
        settings: {
          ...session.settings,
          ...updatedSession.settings,
          ai_configuration: {
            ...session.settings?.ai_configuration,
            ...updatedSession.settings?.ai_configuration,
            // Include timer settings
            timerEnabled: updatedSession.settings?.ai_configuration?.timerEnabled !== undefined
              ? updatedSession.settings.ai_configuration.timerEnabled
              : session.settings?.ai_configuration?.timerEnabled || false,
            timerDuration: updatedSession.settings?.ai_configuration?.timerDuration !== undefined
              ? updatedSession.settings.ai_configuration.timerDuration
              : session.settings?.ai_configuration?.timerDuration || 5
          }
        }
      };
      
      // Use the new updateSession function
      const { data, error } = await updateSession(sessionId, sessionToSave);
      
      if (error) throw error;
      
      console.log('Session updated successfully:', data);
      
      // Redirect back to the session details page
      router.push(`/sessions/${sessionId}?success=session-updated`);
      
    } catch (err) {
      console.error('Error saving session:', err);
      alert('Failed to save changes. Please try again.');
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
                onClick={() => handleSave(session)}
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