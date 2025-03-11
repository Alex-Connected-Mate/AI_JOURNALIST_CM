'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import InputComponent from '@/components/Input';
import TextAreaComponent from '@/components/TextArea';
import ImageSelectorComponent from '@/components/ImageSelector';

// Types pour les composants
interface UserFormData extends Partial<UserProfile> {
  email?: string;
  full_name?: string;
  institution?: string;
  title?: string;
  bio?: string;
  avatar_url?: string | null;
  openai_api_key?: string | null;
  role?: 'user' | 'admin' | 'premium';
  subscription_status?: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_end_date?: string | null;
  stripe_customer_id?: string | null;
}

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, userProfile, updateProfile, uploadAvatar: uploadAvatarToStore, fetchUserProfile, logout } = useStore();
  
  // État pour stocker les informations de l'utilisateur
  const [userData, setUserData] = useState<UserFormData>({
    full_name: '',
    email: '',
    institution: '',
    title: '',
    bio: '',
    avatar_url: null,
    openai_api_key: null,
    role: 'user',
    subscription_status: 'free',
    subscription_end_date: null,
    stripe_customer_id: null,
  });

  // État pour les messages de succès/erreur
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Ajouter des états locaux pour gérer séparément le prénom et le nom
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Charger les données utilisateur depuis Supabase
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Charger le profil depuis Supabase
    const loadUserProfile = async () => {
      setIsLoading(true);
      await fetchUserProfile();
      setIsLoading(false);
    };
    
    loadUserProfile();
  }, [user, fetchUserProfile, router]);

  // Mettre à jour le formulaire quand le profil est chargé
  useEffect(() => {
    if (userProfile) {
      setUserData({
        full_name: userProfile.full_name || '',
        email: user?.email || '',
        institution: userProfile.institution || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url,
        openai_api_key: userProfile.openai_api_key || null,
        role: userProfile.role || 'user',
        subscription_status: userProfile.subscription_status || 'free',
        subscription_end_date: userProfile.subscription_end_date || null,
        stripe_customer_id: userProfile.stripe_customer_id || null,
      });

      // Mettre à jour le prénom et le nom
      if (userProfile.full_name) {
        const nameParts = userProfile.full_name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
      }
    }
  }, [userProfile, user]);

  const handleChange = (field: keyof UserFormData, value: string | null) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNameChange = (type: 'firstName' | 'lastName', value: string) => {
    if (type === 'firstName') {
      setFirstName(value);
    } else {
      setLastName(value);
    }
    
    // Mettre à jour le nom complet
    const fullName = type === 'firstName' 
      ? `${value} ${lastName}`.trim()
      : `${firstName} ${value}`.trim();
      
    handleChange('full_name', fullName);
  };

  const handleSectionSubmit = async (section: 'profile' | 'api' | 'admin') => {
    const sectionData: Partial<UserFormData> = {};
    
    switch (section) {
      case 'profile':
        sectionData.full_name = userData.full_name;
        sectionData.institution = userData.institution;
        sectionData.title = userData.title;
        sectionData.bio = userData.bio;
        break;
      case 'api':
        sectionData.openai_api_key = userData.openai_api_key;
        break;
      case 'admin':
        sectionData.stripe_customer_id = userData.stripe_customer_id;
        sectionData.subscription_end_date = userData.subscription_end_date;
        break;
    }

    setIsLoading(true);
    
    try {
      const { error, data } = await updateProfile(sectionData);
      
      if (error) {
        console.error(`Error updating ${section}:`, error);
        setMessage({
          type: 'error',
          text: `Erreur: ${error.message || `Une erreur est survenue lors de la mise à jour de la section ${section}`}`
        });
      } else {
        console.log(`${section} updated successfully:`, data);
        await fetchUserProfile();
        setMessage({
          type: 'success',
          text: 'Vos informations ont été mises à jour avec succès.'
        });
      }
    } catch (err) {
      console.error(`Unexpected error in ${section} update:`, err);
      setMessage({
        type: 'error',
        text: err instanceof Error 
          ? `Erreur: ${err.message}` 
          : 'Une erreur inattendue est survenue. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le téléchargement d'image
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      const { url, error } = await uploadAvatarToStore(file);
      
      if (error) {
        setMessage({
          type: 'error',
          text: `Erreur lors du téléchargement: ${error.message}`
        });
      } else {
        // Mise à jour réussie, actualiser le profil
        await fetchUserProfile();
        setMessage({
          type: 'success',
          text: 'Image téléchargée avec succès.'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Une erreur est survenue lors du téléchargement de l\'image.'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    }
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (isLoading && !userProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Header user={{ email: userData.email }} logout={handleLogout} />
      
      {message.text && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                selectedImageId={userData.avatar_url || ''}
                onChange={(value) => handleChange('avatar_url', value)}
                helpText="Formats acceptés : JPG, PNG. Max 5MB."
                onFileUpload={handleImageUpload}
              />
              
              <InputComponent
                label="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
                required
              />
              
              <InputComponent
                label="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Votre nom"
                required
              />
              
              <InputComponent
                label="Email"
                value={userData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                type="email"
                required
              />
              
              <InputComponent
                label="Institution"
                value={userData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                placeholder="Votre institution"
              />
              
              <InputComponent
                label="Titre / Fonction"
                value={userData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Votre titre ou fonction"
              />
              
              <TextAreaComponent
                label="Biographie"
                value={userData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Parlez-nous de vous..."
                rows={4}
              />

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleSectionSubmit('profile')}
                  className="cm-button-primary px-6 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enregistrement...' : 'Enregistrer les informations personnelles'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Section API */}
          <div className="second-level-block p-6 rounded-xl mt-8">
            <h2 className="text-xl font-semibold mb-6">Configuration API</h2>
            <div className="space-y-4">
              <InputComponent
                label="Clé API OpenAI"
                value={userData.openai_api_key || ''}
                onChange={(e) => handleChange('openai_api_key', e.target.value)}
                type="password"
                placeholder="sk-..."
              />
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleSectionSubmit('api')}
                  className="cm-button-primary px-6 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enregistrement...' : 'Enregistrer la configuration API'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Section Admin */}
          {userData.role === 'admin' && (
            <div className="second-level-block p-6 rounded-xl mt-8">
              <h2 className="text-xl font-semibold mb-6">Administration</h2>
              <div className="space-y-4">
                <InputComponent
                  label="ID Client Stripe"
                  value={userData.stripe_customer_id || ''}
                  onChange={(e) => handleChange('stripe_customer_id', e.target.value)}
                  disabled
                />
                
                <InputComponent
                  label="Date de fin d'abonnement"
                  value={userData.subscription_end_date ? new Date(userData.subscription_end_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('subscription_end_date', e.target.value)}
                  type="date"
                  disabled
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          <div className="second-level-block p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Statut du compte</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Rôle :</span>{' '}
                <span className="capitalize">{userData.role}</span>
              </p>
              <p>
                <span className="font-medium">Abonnement :</span>{' '}
                <span className="capitalize">{userData.subscription_status}</span>
              </p>
              {userData.subscription_end_date && (
                <p>
                  <span className="font-medium">Expire le :</span>{' '}
                  {formatDate(userData.subscription_end_date)}
                </p>
              )}
            </div>
          </div>
          
          <div className="second-level-block p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full cm-button-secondary"
                disabled={isLoading}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 