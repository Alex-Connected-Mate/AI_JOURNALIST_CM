'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import Button from '@/components/Button';
import QRCode from '@/components/QRCode';
import CopyButton from '@/components/CopyButton';
import { getSessionById, updateSessionStatus } from '@/lib/supabase';

export default function SessionPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useStore();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect to login if user not authenticated
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    const fetchSession = async () => {
      setLoading(true);
      try {
        // Add null check for params
        if (!params?.id) {
          throw new Error('Session ID not found');
        }
        
        const sessionId = params.id as string;
        const { data, error } = await getSessionById(sessionId);
        
        if (error) {
          throw new Error(error.message || 'Failed to fetch session');
        }
        
        if (!data) {
          throw new Error('Session not found');
        }
        
        // Verify the user is the owner of this session
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to view this session');
        }
        
        // Ensure all the data has default values
        const sessionWithDefaults = {
          ...data,
          max_participants: data.max_participants || data.settings?.maxParticipants || 100,
          institution: data.institution || data.settings?.institution || 'Institution non spécifiée',
          professor_name: data.professor_name || data.settings?.professorName || '',
          show_professor_name: data.show_professor_name !== undefined ? data.show_professor_name : (data.settings?.showProfessorName !== undefined ? data.settings.showProfessorName : true),
          company_logo: data.company_logo || null,
          use_profile_avatar: data.use_profile_avatar || false,
          settings: {
            ...data.settings,
            connection: {
              ...data.settings?.connection,
              color: data.settings?.connection?.color || '#3490dc',
              emoji: data.settings?.connection?.emoji || '🎓',
              anonymityLevel: data.settings?.connection?.anonymityLevel || 'anonymous'
            },
            ai_configuration: {
              ...data.settings?.ai_configuration,
              timerEnabled: data.settings?.ai_configuration?.timerEnabled !== undefined 
                ? data.settings.ai_configuration.timerEnabled 
                : true,
              timerDuration: data.settings?.ai_configuration?.timerDuration || 5
            }
          }
        };
        
        setSession(sessionWithDefaults);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, [user, params?.id, router]);
  
  const handleLaunchSession = async () => {
    if (!session) return;
    
    try {
      // Update session status to 'active'
      const { data, error } = await updateSessionStatus(session.id, 'active');
      
      if (error) {
        // Cast error to unknown first, then check its structure
        const err = error as unknown;
        const errorMessage = 
          typeof err === 'object' && 
          err !== null && 
          'message' in err && 
          typeof err.message === 'string'
            ? err.message 
            : 'Failed to launch session';
            
        throw new Error(errorMessage);
      }
      
      // Redirect to the new manage page we created
      router.push(`/sessions/${session.id}/manage`);
    } catch (err: any) {
      console.error('Error launching session:', err);
      setError(err.message);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading session...</div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg max-w-md w-full text-center">
          <h2 className="text-red-700 font-medium">Error</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }
  
  // Create join URL for participants
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  const joinUrl = `${baseUrl}/join/${session.code}`;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Session Header */}
          <div 
            className="p-6 text-white" 
            style={{ backgroundColor: session.settings?.connection?.color || '#3490dc' }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">{session.title || session.name}</h1>
                <p className="text-lg opacity-90">{session.institution || session.settings?.institution}</p>
                {(session.professor_name || session.settings?.professorName) && session.show_professor_name && (
                  <p className="text-sm opacity-80 mt-1">
                    by {session.professor_name || session.settings?.professorName}
                  </p>
                )}
              </div>
              <div className="text-4xl">{session.settings?.connection?.emoji || '🎓'}</div>
            </div>
          </div>
          
          {/* Images section - if images are available */}
          {(session.use_profile_avatar || session.company_logo) && (
            <div className="px-8 pt-6 pb-2">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Images and Logos</h2>
              <div className="flex items-center gap-6">
                {session.use_profile_avatar && userProfile?.avatar_url && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Professor Avatar</p>
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Professor Avatar" 
                      className="h-16 w-16 rounded-full object-cover border border-gray-200"
                    />
                  </div>
                )}
                
                {session.company_logo && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Company/Program Logo</p>
                    <img 
                      src={session.company_logo} 
                      alt="Company Logo" 
                      className="h-16 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Session Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Session Details */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Session Details</h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-700">Session Information</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-medium">{session.status}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Max Participants:</span>
                        <span className="font-medium">
                          {session.max_participants || session.settings?.maxParticipants || 100}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Profile Mode:</span>
                        <span className="font-medium capitalize">
                          {session.settings?.connection?.anonymityLevel || 'anonymous'}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span className="font-medium">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-700">AI Interaction Settings</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Timer Enabled:</span>
                        <span className="font-medium">
                          {session.settings?.ai_configuration?.timerEnabled ? 'Yes' : 'No'}
                        </span>
                      </li>
                      {session.settings?.ai_configuration?.timerEnabled && (
                        <li className="flex justify-between">
                          <span className="text-gray-500">Timer Duration:</span>
                          <span className="font-medium">
                            {session.settings?.ai_configuration?.timerDuration || 5} minutes
                          </span>
                        </li>
                      )}
                      <li className="flex justify-between">
                        <span className="text-gray-500">AI Model:</span>
                        <span className="font-medium">
                          {session.settings?.ai_configuration?.model || 'GPT-4'}
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-gray-500">AI Configuration:</span>
                        <span className="font-medium bg-blue-50 px-2 py-1 rounded text-xs">
                          {session.settings?.ai_configuration?.timerEnabled 
                            ? `Timer: ${session.settings?.ai_configuration?.timerDuration || 5} min` 
                            : 'No timer limit'}
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-700">Access Codes</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex justify-between items-center">
                        <span className="text-gray-500">Session Code:</span>
                        <div className="flex items-center">
                          <span className="font-bold text-indigo-600 mr-2">{session.code}</span>
                          <CopyButton textToCopy={session.code} />
                        </div>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-gray-500">Alternative Code:</span>
                        <div className="flex items-center">
                          <span className="font-bold text-indigo-600 mr-2">{session.session_code}</span>
                          <CopyButton textToCopy={session.session_code} />
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Right Column - QR Code & Actions */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Session Access</h2>
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <QRCode value={joinUrl} size={200} />
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">Participants can join by scanning this QR code or using the URL:</p>
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-gray-800 bg-gray-100 px-3 py-1 rounded-lg mr-2 font-mono truncate max-w-[200px]">
                        {joinUrl}
                      </span>
                      <CopyButton textToCopy={joinUrl} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <Button
                    onClick={handleLaunchSession}
                    fullWidth
                    size="lg"
                    disabled={session.status === 'active' || session.status === 'ended'}
                  >
                    {session.status === 'draft' ? 'Launch Session' : 
                     session.status === 'active' ? 'Session Active' : 'Session Ended'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    fullWidth
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 