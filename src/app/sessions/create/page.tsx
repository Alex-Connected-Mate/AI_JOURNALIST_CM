'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Checkbox from '@/components/Checkbox';
import Select from '@/components/Select';
import ColorPicker from '@/components/ColorPicker';
import EmojiPicker from '@/components/EmojiPicker';
import ImageSelector from '@/components/ImageSelector';
import NumberInput from '@/components/NumberInput';
import RadioGroup from '@/components/RadioGroup';
import Tabs from '@/components/Tabs';
import { createSession } from '@/lib/supabase';

interface SessionError {
  message: string;
}

// Helper function to generate anonymous identifier
const generateAnonymousId = (name: string) => {
  if (!name || name.length < 2) return "XX12345";
  
  const firstTwo = name.substring(0, 2).toUpperCase();
  
  // Create a stable hash based on the name
  const nameHash = name.split('').reduce((acc, char, index) => 
    acc + char.charCodeAt(0) * (index + 1), 0) % 100000;
  
  // Format to ensure it's always 5 digits
  const formattedHash = nameHash.toString().padStart(5, '0');
  
  return `${firstTwo}${formattedHash}`;
};

export default function CreateSessionPage() {
  const router = useRouter();
  const { user, userProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Session form state
  const [sessionName, setSessionName] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [professorName, setProfessorName] = useState<string>('');
  const [showProfessorName, setShowProfessorName] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('university');
  const [profileMode, setProfileMode] = useState<'anonymous' | 'semi-anonymous' | 'non-anonymous'>('anonymous');
  const [color, setColor] = useState<string>('#3490dc');
  const [emoji, setEmoji] = useState<string>('🎓');
  const [maxParticipants, setMaxParticipants] = useState<number>(50);
  
  // États pour le contrôle de l'utilisation des informations du profil
  const [useProfileInstitution, setUseProfileInstitution] = useState<boolean>(false);
  const [useProfileName, setUseProfileName] = useState<boolean>(false);

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Effet pour mettre à jour les champs avec les informations du profil
  useEffect(() => {
    if (userProfile) {
      if (useProfileInstitution && userProfile.institution) {
        setInstitution(userProfile.institution);
      }
      if (useProfileName && userProfile.full_name) {
        setProfessorName(userProfile.full_name);
      }
    }
  }, [userProfile, useProfileInstitution, useProfileName]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a session');
      return;
    }
    
    if (!sessionName || !institution) {
      setError('Session name and institution are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const sessionData = {
        user_id: user.id,
        name: sessionName,
        institution,
        professorName,
        showProfessorName,
        image: selectedImage,
        profileMode,
        color,
        emoji,
        maxParticipants,
      };
      
      const { data, error: apiError } = await createSession(sessionData);
      
      if (apiError) {
        const sessionError = apiError as SessionError;
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };
  
  const handleImageChange = (value: string | null) => {
    setSelectedImage(value || 'university'); // Utiliser une valeur par défaut si null
  };
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'profile', label: 'User Profile' },
    { id: 'appearance', label: 'Appearance' },
  ];
  
  const userModeOptions = [
    {
      value: 'anonymous',
      label: 'Anonymous',
      description: 'Automatically generate an identifier for participants (e.g., "AC16122001").'
    },
    {
      value: 'semi-anonymous',
      label: 'Semi-anonymous',
      description: 'Allow participants to enter a nickname, select an emoji, and optionally add a photo.'
    },
    {
      value: 'non-anonymous',
      label: 'Non-anonymous',
      description: 'Require full participant information (name, email, phone, etc.).'
    }
  ];
  
  // Sample preview data based on current form values
  const previewData = {
    sessionName: sessionName || 'Session Name',
    institution: institution || 'Institution Name',
    professorName: showProfessorName ? (professorName || 'Professor Name') : '',
    image: selectedImage,
    profileMode,
    color,
    emoji,
    anonymousId: generateAnonymousId(professorName || 'Professor'),
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Session</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-6 sm:px-0">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - Form */}
              <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow">
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  className="mb-6"
                />
                
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <Input
                      label="Session Name"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Enter session name"
                      required
                    />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Input
                          label="Institution/Program Name"
                          value={institution}
                          onChange={(e) => {
                            setInstitution(e.target.value);
                            setUseProfileInstitution(false);
                          }}
                          placeholder="Enter institution or program name"
                          required
                        />
                        {userProfile?.institution && (
                          <div className="ml-4 flex items-center">
                            <Checkbox
                              label="Utiliser mon institution"
                              checked={useProfileInstitution}
                              onChange={(checked) => {
                                setUseProfileInstitution(checked);
                                if (checked && userProfile.institution) {
                                  setInstitution(userProfile.institution);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Input
                          label="Professor's Name"
                          value={professorName}
                          onChange={(e) => {
                            setProfessorName(e.target.value);
                            setUseProfileName(false);
                          }}
                          placeholder="Enter professor's name"
                        />
                        {userProfile?.full_name && (
                          <div className="ml-4 flex items-center">
                            <Checkbox
                              label="Utiliser mon nom"
                              checked={useProfileName}
                              onChange={(checked) => {
                                setUseProfileName(checked);
                                if (checked && userProfile.full_name) {
                                  setProfessorName(userProfile.full_name);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Checkbox
                      label="Display professor's name publicly"
                      checked={showProfessorName}
                      onChange={setShowProfessorName}
                    />
                    
                    <NumberInput
                      label="Maximum Number of Participants"
                      value={maxParticipants}
                      onChange={setMaxParticipants}
                      min={1}
                      max={1000}
                    />
                  </div>
                )}
                
                {/* User Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <RadioGroup
                      label="User Profile Mode"
                      name="profileMode"
                      options={userModeOptions}
                      value={profileMode}
                      onChange={(value) => setProfileMode(value as 'anonymous' | 'semi-anonymous' | 'non-anonymous')}
                    />
                    
                    {profileMode === 'semi-anonymous' && (
                      <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Semi-anonymous Mode Options
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Participants will be able to:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                          <li>Enter a nickname</li>
                          <li>Select an emoji from a predefined list</li>
                          <li>Optionally upload a profile photo</li>
                        </ul>
                      </div>
                    )}
                    
                    {profileMode === 'non-anonymous' && (
                      <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Non-anonymous Mode Options
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Participants will need to provide:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                          <li>Full name</li>
                          <li>Email address</li>
                          <li>Phone number (optional)</li>
                          <li>Additional contact links (optional)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-4">
                    <ImageSelector
                      label="Session Image"
                      selectedImageId={selectedImage}
                      onChange={handleImageChange}
                      onFileUpload={async (file) => {
                        // Gérer le téléchargement du fichier ici
                        console.log('File upload not implemented yet:', file);
                      }}
                    />
                    
                    <ColorPicker
                      label="Session Color"
                      selectedColor={color}
                      onChange={setColor}
                    />
                    
                    <EmojiPicker
                      label="Session Emoji"
                      selectedEmoji={emoji}
                      onChange={setEmoji}
                    />
                  </div>
                )}
                
                {error && (
                  <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    {error}
                  </div>
                )}
                
                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.push('/dashboard')}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    isLoading={loading}
                  >
                    Create Session
                  </Button>
                </div>
              </div>
              
              {/* Right Column - Preview */}
              <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Live Preview</h2>
                  <p className="text-sm text-gray-500">
                    See how your session will appear to participants
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  {/* Session Header */}
                  <div 
                    className="p-6 text-white" 
                    style={{ backgroundColor: previewData.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{previewData.sessionName}</h3>
                        <p className="text-lg opacity-90">{previewData.institution}</p>
                        {previewData.professorName && (
                          <p className="text-sm opacity-80 mt-1">
                            by {previewData.professorName}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-4xl">{previewData.emoji}</div>
                    </div>
                  </div>
                  
                  {/* Session Content */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        User Profile Preview
                      </h4>
                      
                      {previewData.profileMode === 'anonymous' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <span className="text-lg">{previewData.emoji}</span>
                            </div>
                            <div>
                              <p className="font-medium">Anonymous User</p>
                              <p className="text-sm text-gray-500">ID: {previewData.anonymousId}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {previewData.profileMode === 'semi-anonymous' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                              style={{ backgroundColor: previewData.color }}
                            >
                              <span className="text-lg text-white">{previewData.emoji}</span>
                            </div>
                            <div>
                              <p className="font-medium">NickName123</p>
                              <p className="text-sm text-gray-500">Semi-anonymous user</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {previewData.profileMode === 'non-anonymous' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3"
                            >
                              <span className="text-sm text-gray-600">JD</span>
                            </div>
                            <div>
                              <p className="font-medium">John Doe</p>
                              <p className="text-sm text-gray-500">john.doe@example.com</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Session Features Preview
                      </h4>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-sm text-gray-700">
                          This is a preview of your interactive session. The actual interface will include:
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc pl-5">
                          <li>Live voting capabilities</li>
                          <li>AI-driven chat for "nuggets" and "light bulbs"</li>
                          <li>Real-time synchronization</li>
                          <li>QR code connection option</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex justify-between items-center">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Maximum Participants:</span> {maxParticipants}
                        </div>
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-300">
                          0 / {maxParticipants} joined
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
} 