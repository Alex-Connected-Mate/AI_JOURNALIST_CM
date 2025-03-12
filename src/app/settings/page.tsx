'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { UserProfile } from '@/lib/types';
import InputComponent from '@/components/Input';
import TextAreaComponent from '@/components/TextArea';
import ImageSelectorComponent from '@/components/ImageSelector';
import { ErrorBoundary } from 'react-error-boundary';

// Helper function to format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Fallback component if an error occurs
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-md my-4">
      <h2 className="text-xl font-bold text-red-800 mb-2">Une erreur est survenue :</h2>
      <pre className="text-sm bg-white p-3 rounded border border-red-100 overflow-auto">
        {error.message}
      </pre>
      <button 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        onClick={() => window.location.reload()}
      >
        Réessayer
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, userProfile, updateProfile, uploadAvatar: uploadAvatarToStore, fetchUserProfile, logout, authChecked } = useStore();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    title: '',
    bio: '',
    avatar_url: '',
    openai_api_key: ''
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Redirect if not logged in (but only after auth check is complete)
  useEffect(() => {
    if (authChecked && !user) {
      console.log('User not authenticated, redirecting to login');
      router.push('/auth/login');
    }
  }, [user, router, authChecked]);

  // Load user profile with error handling and loading state
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      if (fetchingProfile) return; // Prevent duplicate calls
      
      try {
        setFetchingProfile(true);
        setProfileError(null);
        console.log('Fetching user profile data');
        
        await fetchUserProfile();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileError(error instanceof Error ? error.message : 'Erreur lors du chargement du profil');
        setMessage({
          type: 'error',
          text: 'Erreur lors du chargement du profil'
        });
      } finally {
        setFetchingProfile(false);
      }
    };
    
    if (user && !isInitialized && !fetchingProfile) {
      loadProfile();
    }
  }, [user, fetchUserProfile, isInitialized, fetchingProfile]);

  // Update form when profile changes
  useEffect(() => {
    if (userProfile) {
      console.log('Updating form with profile data', userProfile);
      const nameParts = (userProfile.full_name || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user?.email || '',
        institution: userProfile.institution || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || '',
        openai_api_key: userProfile.openai_api_key || ''
      });
    }
  }, [userProfile, user]);

  // Handle form changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle profile update
  const handleSubmit = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      console.log('Updating profile with data', { fullName, institution: formData.institution });
      
      const { error } = await updateProfile({
        full_name: fullName,
        institution: formData.institution,
        title: formData.title,
        bio: formData.bio,
        openai_api_key: formData.openai_api_key
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      await fetchUserProfile();
      setMessage({
        type: 'success',
        text: 'Profil mis à jour avec succès'
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file || isLoading) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log('Uploading image', file.name);
      const { error } = await uploadAvatarToStore(file);
      
      if (error) {
        throw new Error(error.message);
      }
      
      await fetchUserProfile();
      setMessage({
        type: 'success',
        text: 'Image mise à jour avec succès'
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors du téléchargement de l\'image'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Logging out user');
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la déconnexion'
      });
      setIsLoading(false); // Only reset loading here if error, otherwise redirect will happen
    }
  };

  // Show debug information in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Settings page state:', { 
        user: !!user, 
        userProfile: !!userProfile,
        authChecked,
        isInitialized,
        fetchingProfile,
        isLoading
      });
    }
  }, [user, userProfile, authChecked, isInitialized, fetchingProfile, isLoading]);

  // Loading state
  if (!authChecked) {
    console.log('Auth check not complete yet');
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Vérification de l'authentification...</p>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    console.log('User not logged in, showing message');
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="mb-4">Vous devez être connecté pour accéder à cette page.</div>
        <button 
          onClick={() => router.push('/auth/login')} 
          className="cm-button-primary"
        >
          Se connecter
        </button>
      </div>
    );
  }

  // Loading profile data
  if (fetchingProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Chargement du profil...</p>
      </div>
    );
  }

  // Error loading profile
  if (profileError && !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erreur de chargement du profil</h2>
          <p className="mb-4">{profileError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto px-4 py-8">
        <Header user={{ email: formData.email }} logout={handleLogout} />
        
        {message.text && (
          <div 
            className={`mb-4 p-4 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 
              message.type === 'error' ? 'bg-red-100 text-red-700' : ''
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="second-level-block p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-6">Informations personnelles</h2>
              
              <div className="space-y-4">
                <ImageSelectorComponent
                  label="Photo de profil"
                  selectedImageId={formData.avatar_url}
                  onChange={(value) => handleChange('avatar_url', value || '')}
                  onFileUpload={handleImageUpload}
                />
                
                <InputComponent
                  label="Prénom"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Votre prénom"
                  required
                />
                
                <InputComponent
                  label="Nom"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Votre nom"
                  required
                />
                
                <InputComponent
                  label="Email"
                  value={formData.email}
                  onChange={() => {}}
                  type="email"
                  disabled
                  required
                />
                
                <InputComponent
                  label="Institution"
                  value={formData.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  placeholder="Votre institution"
                />
                
                <InputComponent
                  label="Titre / Fonction"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Votre titre ou fonction"
                />
                
                <TextAreaComponent
                  label="Biographie"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Parlez-nous de vous..."
                  rows={4}
                />

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSubmit}
                    className="cm-button-primary px-6 py-2 relative"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Enregistrement...</span>
                      </div>
                    ) : (
                      'Enregistrer'
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="second-level-block p-6 rounded-xl mt-8">
              <h2 className="text-xl font-semibold mb-6">Configuration API</h2>
              <div className="space-y-4">
                <InputComponent
                  label="Clé API OpenAI"
                  value={formData.openai_api_key}
                  onChange={(e) => handleChange('openai_api_key', e.target.value)}
                  type="password"
                  placeholder="sk-..."
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="second-level-block p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Statut du compte</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Rôle :</span>{' '}
                  <span className="capitalize">{userProfile?.role || 'user'}</span>
                </p>
                <p>
                  <span className="font-medium">Abonnement :</span>{' '}
                  <span className="capitalize">{userProfile?.subscription_status || 'free'}</span>
                </p>
                {userProfile?.subscription_end_date && (
                  <p>
                    <span className="font-medium">Expire le :</span>{' '}
                    {formatDate(userProfile.subscription_end_date)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="second-level-block p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full cm-button-secondary flex justify-center items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600 mr-2"></div>
                      <span>Déconnexion...</span>
                    </div>
                  ) : (
                    'Déconnexion'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 