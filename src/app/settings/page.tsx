'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import ImageSelector from '@/components/ImageSelector';

// Types pour les composants
interface UserFormData extends Partial<UserProfile> {
  email?: string;
  full_name?: string;
  institution?: string;
  title?: string;
  bio?: string;
  avatar_url?: string | null;
}

interface InputProps {
  label: string;
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  type?: string;
}

interface TextAreaProps {
  label: string;
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

interface ImageSelectorProps {
  label: string;
  selectedImageId: string | null;
  onChange: (value: string | null) => void;
  helpText?: string;
  onFileUpload: (file: File) => Promise<void>;
}

// Composant Input réutilisable
const Input: React.FC<InputProps> = ({ label, value = '', onChange, placeholder, required, icon, type = "text" }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative rounded-lg flex items-center">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-500">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`cm-input transition-all duration-200 ${icon ? 'pl-10' : ''}`}
        required={required}
      />
    </div>
  </div>
);

// Après la définition du composant Input, ajouter le composant TextArea
const TextArea: React.FC<TextAreaProps> = ({ label, value = '', onChange, placeholder, rows = 4 }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="cm-input transition-all duration-200 w-full"
    />
  </div>
);

// Composant ImageSelector
const ImageSelector: React.FC<ImageSelectorProps> = ({ label, selectedImageId, onChange, helpText, onFileUpload }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div 
        className={`second-level-block p-6 rounded-xl text-center cursor-pointer ${isDragging ? 'bg-blue-50 border-blue-300' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="mx-auto h-12 w-12 text-blue-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="font-medium text-gray-900 mb-1">
          {isUploading ? 'Téléchargement...' : 'Télécharger une image'}
        </div>
        <p className="text-sm text-gray-500">Glissez-déposez ou cliquez pour sélectionner</p>
      </div>
      {selectedImageId && (
        <div className="mt-2 flex items-center">
          <div className="h-10 w-10 overflow-hidden rounded-full mr-2">
            <img src={selectedImageId} alt="Selected" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm text-gray-600">Image sélectionnée</span>
        </div>
      )}
      {helpText && !selectedImageId && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

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
      });
    }
  }, [userProfile, user]);

  // Mettre à jour les états firstName et lastName quand le profil est chargé
  useEffect(() => {
    if (userProfile && userProfile.full_name) {
      const nameParts = userProfile.full_name.split(' ');
      if (nameParts.length >= 2) {
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(' '));
      } else {
        setFirstName(userProfile.full_name);
        setLastName('');
      }
    }
  }, [userProfile]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs obligatoires
    if (!userData.full_name) {
      setMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await updateProfile(userData);
      
      if (error) {
        setMessage({
          type: 'error',
          text: `Erreur: ${error.message}`
        });
      } else {
        // Recharger le profil après la mise à jour
        await fetchUserProfile();
        setMessage({
          type: 'success',
          text: 'Vos informations ont été mises à jour avec succès.'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Une erreur inattendue est survenue. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
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
    <div className="min-h-screen">
      {/* Header */}
      <Header user={{ email: userData.email }} logout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-bricolage">Réglages du compte</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos informations personnelles et les paramètres de votre compte.
          </p>
        </div>
        
        {/* Message de succès/erreur */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Panneau de navigation */}
          <div className="first-level-block p-6 rounded-xl h-fit">
            <nav className="space-y-1">
              <a href="#profile" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Profil
              </a>
              <a href="#security" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sécurité
              </a>
              <a href="#connections" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Connexions
              </a>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </nav>
          </div>
          
          {/* Formulaire principal */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section Profil */}
              <div id="profile" className="first-level-block p-6 rounded-xl">
                <h2 className="text-xl font-semibold font-bricolage border-b pb-2 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Informations Personnelles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-6">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow">
                        {userData.avatar_url ? (
                          <Image 
                            src={userData.avatar_url} 
                            alt="Photo de profil" 
                            fill 
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-lg font-medium text-gray-900">
                          {userData.full_name || 'Votre nom'}
                        </div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                        <button 
                          type="button" 
                          className="cm-button-secondary text-sm px-3 py-1"
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/*';
                            fileInput.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files.length > 0) {
                                handleImageUpload(files[0]);
                              }
                            };
                            fileInput.click();
                          }}
                        >
                          Changer la photo
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <Input
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => handleNameChange('firstName', e.target.value)}
                    placeholder="Votre prénom"
                    required
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Nom"
                    value={lastName}
                    onChange={(e) => handleNameChange('lastName', e.target.value)}
                    placeholder="Votre nom"
                    required
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Nom d'usage"
                    value={userData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Nom affiché publiquement"
                    required
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Email"
                    value={userData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre.email@example.com"
                    required
                    type="email"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    }
                  />

                  <Input
                    label="Titre / Fonction"
                    value={userData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Votre titre ou fonction"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    }
                  />

                  <TextArea
                    label="Biographie"
                    value={userData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Une courte description de vous-même"
                    rows={4}
                  />
                </div>
              </div>
              
              {/* Section Entreprise */}
              <div className="first-level-block p-6 rounded-xl">
                <h2 className="text-xl font-semibold font-bricolage border-b pb-2 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  Informations de l'Entreprise (Optionnel)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nom de l'entreprise"
                    value={userData.institution}
                    onChange={(e) => handleChange('institution', e.target.value)}
                    placeholder="Nom de votre entreprise"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  
                  <div className="md:col-span-2">
                    <ImageSelector
                      label="Logo de l'entreprise"
                      selectedImageId={userData.avatar_url}
                      onChange={(value) => handleChange('avatar_url', value)}
                      helpText="Format recommandé : PNG ou JPG, 400x400px minimum"
                      onFileUpload={(file) => handleImageUpload(file)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Section Connexions */}
              <div id="connections" className="first-level-block p-6 rounded-xl">
                <h2 className="text-xl font-semibold font-bricolage border-b pb-2 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Connexions
                </h2>
                
                <div className="space-y-4">
                  <div className="second-level-block p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">WhatsApp</h3>
                          <p className="text-sm text-gray-500">Connectez votre compte WhatsApp</p>
                        </div>
                      </div>
                      <button type="button" className="cm-button px-4 py-2 text-sm">
                        Connecter
                      </button>
                    </div>
                  </div>
                  
                  <div className="second-level-block p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Email</h3>
                          <p className="text-sm text-gray-500">Vérifiez votre adresse email</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Vérifié
                      </span>
                    </div>
                  </div>
                  
                  <div className="second-level-block p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Téléphone</h3>
                          <p className="text-sm text-gray-500">Ajoutez un numéro de téléphone</p>
                        </div>
                      </div>
                      <button type="button" className="cm-button-secondary px-4 py-2 text-sm">
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4">
                <Link href="/dashboard" className="cm-button-secondary px-6 py-2">
                  Annuler
                </Link>
                <button type="submit" className="cm-button px-6 py-2">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 