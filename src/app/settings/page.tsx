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
import { useTranslation } from '@/components/LocaleProvider';
import { useReadingTracker } from '@/hooks/useReadingTracker';

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
  const { t, locale } = useTranslation();
  const { user, userProfile, updateProfile, uploadAvatar: uploadAvatarToStore, fetchUserProfile, logout, authChecked } = useStore();
  const { settings: readingSettings, updateSettings: updateReadingSettings, stats: readingStats } = useReadingTracker();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    title: '',
    bio: '',
    avatar_url: '',
    openai_api_key: '',
    use_own_api_key: false
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
      const nameParts = (userProfile.full_name || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user?.email || '',
        institution: userProfile.institution || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || '',
        openai_api_key: userProfile.openai_api_key || '',
        use_own_api_key: userProfile.use_own_api_key || false
      });
    }
  }, [userProfile, user]);

  // Handle form changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    console.log('Form data updated:', field, value);
  };

  // Handle profile update
  const handleSubmit = async () => {
    if (isLoading) {
      console.log('🔴 [SETTINGS] Update aborted: already loading');
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      console.log('🔵 [SETTINGS] Starting profile update...');
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Validate required fields
      if (!fullName) {
        console.error('🔴 [SETTINGS] Validation failed: name is required');
        setMessage({
          type: 'error',
          text: 'Le nom est requis'
        });
        setIsLoading(false);
        return;
      }
      
      const updateData: Partial<UserProfile> = {
        full_name: fullName,
        institution: formData.institution || null,
        title: formData.title || null,
        bio: formData.bio || null,
        openai_api_key: formData.openai_api_key || null,
        use_own_api_key: formData.use_own_api_key
      };
      
      console.log('🔵 [SETTINGS] Updating profile with data:', updateData);
      const { data: updatedProfile, error } = await updateProfile(updateData);
      
      if (error) {
        console.error('🔴 [SETTINGS] Profile update failed:', error);
        let errorMessage = error.message || 'Erreur lors de la mise à jour du profil';
        
        // Handle specific error cases
        if (typeof error === 'object' && error !== null && 'code' in error) {
          switch (error.code) {
            case 'UPDATE_ERROR':
              errorMessage = 'Erreur lors de la mise à jour. Veuillez réessayer.';
              break;
            case 'VALIDATION_ERROR':
              errorMessage = 'details' in error && error.details ? 
                error.details : 'Données invalides';
              break;
            case 'NOT_FOUND':
              errorMessage = 'Profil non trouvé. Veuillez vous reconnecter.';
              // Redirect to login
              window.location.href = '/auth/login';
              break;
            case 'AUTH_ERROR':
              errorMessage = 'Session expirée. Veuillez vous reconnecter.';
              // Redirect to login
              window.location.href = '/auth/login';
              break;
            default:
              errorMessage = error.message || 'Une erreur inattendue est survenue';
          }
        }
        
        setMessage({
          type: 'error',
          text: errorMessage
        });
        setIsLoading(false);
        return;
      }
      
      if (!updatedProfile) {
        console.error('🔴 [SETTINGS] No data returned from update');
        throw new Error('No data returned from profile update');
      }
      
      console.log('✅ [SETTINGS] Profile updated successfully:', updatedProfile);
      
      // Verify the update
      console.log('🔵 [SETTINGS] Fetching updated profile');
      await fetchUserProfile();
      
      // Compare updated fields
      const currentProfile = userProfile;
      if (currentProfile) {
        const nameParts = (currentProfile.full_name || '').split(' ');
        const expectedFirstName = formData.firstName;
        const expectedLastName = formData.lastName;
        
        if (nameParts[0] !== expectedFirstName || nameParts.slice(1).join(' ') !== expectedLastName) {
          console.warn('🟡 [SETTINGS] Name mismatch after update:', {
            expected: { firstName: expectedFirstName, lastName: expectedLastName },
            actual: nameParts
          });
        }

        // Compare other fields
        const fieldsToCheck = ['institution', 'title', 'bio', 'openai_api_key'] as const;
        const mismatches = fieldsToCheck.filter(field => 
          updateData[field] !== currentProfile[field]
        );

        if (mismatches.length > 0) {
          console.warn('🟡 [SETTINGS] Field mismatches:', {
            fields: mismatches,
            expected: updateData,
            actual: currentProfile
          });
          
          // If there are mismatches, try updating again
          console.log('🔵 [SETTINGS] Retrying update due to mismatches');
          const retryResult = await updateProfile(updateData);
          if (retryResult.error) {
            console.warn('🟡 [SETTINGS] Retry update failed:', retryResult.error);
          } else {
            console.log('✅ [SETTINGS] Retry update successful');
            await fetchUserProfile();
          }
        }
      }
      
      setMessage({
        type: 'success',
        text: 'Profil mis à jour avec succès'
      });
      
      console.log('🔵 [SETTINGS] Reloading page to show changes');
      // Force reload after a short delay to ensure state is updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('🔴 [SETTINGS] Error updating profile:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string | null> => {
    console.log('🔵 [SETTINGS] Avatar upload initiated');
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Vérifier la taille du fichier (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error('🔴 [SETTINGS] File too large:', file.size);
        throw new Error('Fichier trop volumineux. La taille maximale est de 5MB.');
      }

      console.log('🔵 [SETTINGS] Calling uploadAvatarToStore');
      const { url, error } = await uploadAvatarToStore(file);
      
      if (error) {
        console.error('🔴 [SETTINGS] Avatar upload failed:', error);
        throw new Error(error.message || 'Erreur lors du téléchargement de l\'image');
      }
      
      if (!url) {
        console.error('🔴 [SETTINGS] No URL returned from avatar upload');
        throw new Error('Aucune URL retournée pour l\'image téléchargée');
      }
      
      console.log('✅ [SETTINGS] Avatar uploaded successfully:', url);
      
      // Actualiser le profil pour voir les changements
      console.log('🔵 [SETTINGS] Refreshing profile after avatar update');
      await fetchUserProfile();
      
      setMessage({
        type: 'success',
        text: 'Image mise à jour avec succès'
      });
      
      // Mettre à jour le formulaire avec la nouvelle URL
      setFormData(prev => ({
        ...prev,
        avatar_url: url
      }));
      
      return url;
    } catch (err) {
      console.error('🔴 [SETTINGS] Error uploading avatar:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors du téléchargement de l\'image'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      console.log('🔵 [SETTINGS] Starting logout process');
      
      // Sauvegarder l'état actuel avant la déconnexion
      const currentEmail = user?.email;
      console.log(`🔵 [SETTINGS] Logging out user: ${currentEmail}`);
      
      // Nettoyage synchrone du stockage local
      if (typeof window !== 'undefined') {
        console.log('🔵 [SETTINGS] Clearing local storage');
        try {
          // Sauvegarder certaines préférences non sensibles si nécessaire
          // const savedPreferences = localStorage.getItem('user-preferences');
          
          // Vider complètement le stockage
          localStorage.clear();
          sessionStorage.clear();
          
          // Supprimer spécifiquement les cookies liés à l'authentification
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
          
          // Restaurer certaines préférences non sensibles si nécessaire
          // if (savedPreferences) localStorage.setItem('user-preferences', savedPreferences);
        } catch (e) {
          console.error('🔴 [SETTINGS] Error clearing storage:', e);
        }
      }
      
      // Réinitialisation des données de formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        institution: '',
        title: '',
        bio: '',
        avatar_url: '',
        openai_api_key: '',
        use_own_api_key: false
      });
      
      try {
        // Attendre que le store effectue la déconnexion
        console.log('🔵 [SETTINGS] Calling store logout');
        await logout();
        console.log('✅ [SETTINGS] Store logout completed');
      } catch (logoutError) {
        console.error('🔴 [SETTINGS] Store logout error:', logoutError);
        // Continuer la redirection même en cas d'erreur
      }
      
      // Redirection forcée vers la page de connexion
      console.log('🔵 [SETTINGS] Redirecting to login page');
      if (typeof window !== 'undefined') {
        // Utiliser replaceState pour éviter les retours en arrière vers les pages protégées
        window.history.replaceState(null, '', '/auth/login');
        // Forcer un rechargement complet pour s'assurer que tout état est réinitialisé
        window.location.href = '/auth/login';
      } else {
        // Fallback si window n'est pas disponible
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('🔴 [SETTINGS] Logout error:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la déconnexion. Veuillez réessayer.'
      });
      
      // En cas d'erreur, forcer quand même la redirection
      console.log('🔵 [SETTINGS] Forcing redirect after error');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      } else {
        router.replace('/auth/login');
      }
    } finally {
      // Réinitialiser l'état de chargement au cas où la redirection échoue
      setIsLoading(false);
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
              message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 
              message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : ''
            }`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : message.type === 'error' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : null}
              {message.text}
            </div>
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
                  error={!formData.firstName ? 'Le prénom est requis' : ''}
                />
                
                <InputComponent
                  label="Nom"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Votre nom"
                  required
                  error={!formData.lastName ? 'Le nom est requis' : ''}
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
                    className="cm-button-primary px-6 py-2 relative flex items-center justify-center min-w-[150px]"
                    disabled={isLoading || !formData.firstName || !formData.lastName}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Enregistrement...</span>
                      </>
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
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Vous pouvez utiliser votre propre clé API OpenAI pour les fonctionnalités d'IA, ou utiliser celle fournie par le service.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-2 py-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Utiliser ma propre clé API</p>
                    <p className="text-sm text-gray-500">Activez cette option pour utiliser votre clé API personnelle</p>
                  </div>
                  <label className="relative inline-block w-14 h-7">
                    <input
                      type="checkbox"
                      className="opacity-0 w-0 h-0"
                      checked={formData.use_own_api_key}
                      onChange={(e) => handleChange('use_own_api_key', e.target.checked)}
                    />
                    <span 
                      className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${
                        formData.use_own_api_key ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span 
                        className={`absolute h-5 w-5 top-1 bg-white rounded-full transition-all duration-300 transform ${
                          formData.use_own_api_key ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      ></span>
                    </span>
                  </label>
                </div>
                
                <InputComponent
                  label="Clé API OpenAI"
                  value={formData.openai_api_key}
                  onChange={(e) => handleChange('openai_api_key', e.target.value)}
                  type="password"
                  placeholder="sk-..."
                  disabled={!formData.use_own_api_key}
                />
                
                {formData.use_own_api_key && !formData.openai_api_key && (
                  <p className="text-yellow-600 text-sm mt-1">
                    Vous avez activé l'utilisation de votre propre clé API mais aucune clé n'est renseignée. 
                    Le service utilisera sa clé par défaut jusqu'à ce que vous en fournissiez une.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="second-level-block p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Notifications de lecture</h3>
              <div className="space-y-4">
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-purple-700">
                        Configurez les notifications et le suivi de vos sessions de lecture. Ces fonctionnalités vous aident à rester concentré et à suivre votre progression.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2 py-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Dynamic Island</p>
                      <p className="text-sm text-gray-500">Affiche une notification persistante en haut de l'écran pendant la lecture</p>
                    </div>
                    <label className="relative inline-block w-14 h-7">
                      <input
                        type="checkbox"
                        className="opacity-0 w-0 h-0"
                        checked={readingSettings.enableDynamicIsland}
                        onChange={(e) => updateReadingSettings({ enableDynamicIsland: e.target.checked })}
                      />
                      <span 
                        className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${
                          readingSettings.enableDynamicIsland ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span 
                          className={`absolute h-5 w-5 top-1 bg-white rounded-full transition-all duration-300 transform ${
                            readingSettings.enableDynamicIsland ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        ></span>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between px-2 py-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Live Activity</p>
                      <p className="text-sm text-gray-500">Affiche un widget détaillé avec temps et progression en bas à droite</p>
                    </div>
                    <label className="relative inline-block w-14 h-7">
                      <input
                        type="checkbox"
                        className="opacity-0 w-0 h-0"
                        checked={readingSettings.enableLiveActivity}
                        onChange={(e) => updateReadingSettings({ enableLiveActivity: e.target.checked })}
                      />
                      <span 
                        className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${
                          readingSettings.enableLiveActivity ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span 
                          className={`absolute h-5 w-5 top-1 bg-white rounded-full transition-all duration-300 transform ${
                            readingSettings.enableLiveActivity ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        ></span>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between px-2 py-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Notifications push</p>
                      <p className="text-sm text-gray-500">Notifications système pour le début/fin de lecture et rappels</p>
                    </div>
                    <label className="relative inline-block w-14 h-7">
                      <input
                        type="checkbox"
                        className="opacity-0 w-0 h-0"
                        checked={readingSettings.enableReadingNotifications}
                        onChange={(e) => updateReadingSettings({ enableReadingNotifications: e.target.checked })}
                      />
                      <span 
                        className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ${
                          readingSettings.enableReadingNotifications ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span 
                          className={`absolute h-5 w-5 top-1 bg-white rounded-full transition-all duration-300 transform ${
                            readingSettings.enableReadingNotifications ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        ></span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Statistiques du jour :</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-lg font-bold text-blue-600">{readingStats.readToday}</div>
                      <div className="text-xs text-gray-600">Posts lus</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-lg font-bold text-orange-600">{readingStats.remaining}</div>
                      <div className="text-xs text-gray-600">Restants</div>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Suivi automatique du temps de lecture</li>
                    <li>• Comptage des posts lus dans la journée</li>
                    <li>• Rappels visuels pour ne pas oublier de terminer la lecture</li>
                    <li>• Statistiques de progression en temps réel</li>
                  </ul>
                  <div className="mt-3">
                    <a 
                      href="/demo-reading" 
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      → Tester les fonctionnalités
                    </a>
                  </div>
                </div>
              </div>
            </div>

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

      {/* Bento-style Connected Mate branding card */}
      <div className="mt-12 mb-8 max-w-4xl mx-auto px-4">
        <div className="bento-card overflow-hidden border border-gray-200 transform transition-all hover:scale-[1.02] hover:shadow-md">
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-gradient-to-br from-blue-500 to-purple-500"></div>
            <div className="flex flex-col md:flex-row justify-between items-center p-8 gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Powered by Connected Mate</h3>
                <p className="text-gray-600">Découvrez comment nous utilisons l'IA pour révolutionner les interactions et l'analyse des données.</p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <a 
                  href="https://www.linkedin.com/company/connected-mate" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 00.1.4V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                  </svg>
                  <span>Suivez-nous sur LinkedIn</span>
                </a>
                <span className="text-sm text-gray-500">Connected Mate © {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 