'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SessionCreationFlow from '@/components/SessionCreationFlow';

export default function EditSessionPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
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
        
        // In a real implementation, this would fetch from your database
        // For example:
        // const { data, error } = await supabase
        //   .from('sessions')
        //   .select('*')
        //   .eq('id', sessionId)
        //   .single();
        
        // If (!data) throw new Error('Session not found');
        // setSession(data);
        
        // For now, just set an empty object
        setSession({
          id: sessionId,
          name: '',
          institution: '',
          description: '',
          status: 'draft',
          created_at: new Date().toISOString(),
          user_id: user.id,
          config: {}
        });

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
      
      // Merge the updated session data with the existing session
      const sessionToSave = {
        ...session,
        ...updatedSession
      };
      
      // In a real implementation, this would update in your database
      // For example:
      // const { error } = await supabase
      //   .from('sessions')
      //   .update(sessionToSave)
      //   .eq('id', sessionId);
      
      // if (error) throw error;
      
      // Log for development
      console.log('Saving session:', sessionToSave);
      
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
            initialSession={session}
            onComplete={handleSave}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
} 