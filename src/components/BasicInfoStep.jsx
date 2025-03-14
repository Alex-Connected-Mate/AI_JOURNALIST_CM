import React, { useEffect } from 'react';
import Input from './Input';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';
import ImageSelector from './ImageSelector';
import { useStore } from '@/lib/store';

/**
 * BasicInfoStep Component
 * 
 * Form for entering basic session information including:
 * - Session name
 * - Institution/company name
 * - Professor name
 * - Maximum participants
 * - Company logo/images
 * - Visibility settings for each information element
 */
const BasicInfoStep = ({ sessionConfig, updateSessionConfig, errors = {} }) => {
  // Get user profile from store
  const { userProfile } = useStore();
  
  const {
    sessionName = '',
    title = '',
    institution = '',
    professorName = '',
    maxParticipants = 50,
    showProfessorName = true,
    showInstitution = true,
    selectedImage = 'university',
    useProfileAvatar = false,
    companyLogo = null,
  } = sessionConfig;

  // Use the proper title value (prefer title or fall back to sessionName)
  const displayName = title || sessionName;
  
  // Auto-populate fields from user profile when component mounts
  useEffect(() => {
    if (userProfile && !institution && userProfile.institution) {
      // Auto-fill institution from user profile if not already set
      handleChange('institution', userProfile.institution);
    }
    
    if (userProfile && !professorName && userProfile.full_name) {
      // Auto-fill professor name from user profile if not already set
      handleChange('professorName', userProfile.full_name);
    }
    
    if (userProfile && userProfile.avatar_url) {
      // Use profile avatar as session image if available
      handleChange('selectedImage', userProfile.avatar_url);
    }
  }, [userProfile]);

  // Synchronize title and sessionName whenever either changes
  useEffect(() => {
    // Only run this effect if there is a mismatch between the two fields
    if ((title && !sessionName) || (sessionName && !title) || (title !== sessionName && title && sessionName)) {
      // Keep both fields in sync
      const valueToUse = title || sessionName;
      updateSessionConfig({
        ...sessionConfig,
        title: valueToUse,
        sessionName: valueToUse
      });
    }
  }, [title, sessionName]);

  const handleChange = (field, value) => {
    const updates = {
      ...sessionConfig,
      [field]: value
    };
    
    // If we're updating the session name, also update the title for compatibility
    if (field === 'sessionName') {
      updates.title = value;
      
      // Also update the title in the basicInfo object if it exists
      if (sessionConfig.basicInfo) {
        updates.basicInfo = {
          ...sessionConfig.basicInfo,
          title: value
        };
      }
    }
    
    // If we're somehow updating the title directly, also update sessionName
    if (field === 'title') {
      updates.sessionName = value;
    }
    
    updateSessionConfig(updates);
  };
  
  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    try {
      // In a real implementation, this would upload to Supabase and get URL
      console.log('Uploading file:', file.name);
      
      // For now, we'll use a placeholder URL to demonstrate the flow
      // In production, this would be replaced with a real upload
      // handleChange('selectedImage', uploadedImageUrl);
      
      // Don't do anything yet since we don't have the upload implementation here
      // The actual upload is implemented in the src/app/sessions/create/page.tsx
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="second-level-block p-4 rounded-xl bg-blue-50/70 border-l-4 border-blue-500">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-blue-700 font-medium">
              Ces informations de base définissent les détails essentiels de votre session.
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Vous pourrez configurer les phases de la session dans les étapes suivantes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="second-level-block p-6 rounded-xl space-y-6">
          <h3 className="text-lg font-semibold font-bricolage border-b pb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Informations Générales
          </h3>
          
          <div className="space-y-5">
            <Input
              label="Nom de la Session"
              value={displayName}
              onChange={(e) => handleChange('sessionName', e.target.value)}
              placeholder="Ex: Workshop Innovation Q1 2023"
              required
              error={errors.sessionName || errors.title}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z" clipRule="evenodd" />
                </svg>
              }
            />
            
            <div className="space-y-2">
              <Input
                label="Institution / Entreprise"
                value={institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                placeholder="Ex: Connected Mate SAS"
                required
                error={errors.institution}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                }
              />
              
              <div className="ml-6">
                <Checkbox
                  label="Afficher le nom de l'institution"
                  checked={showInstitution}
                  onChange={(value) => handleChange('showInstitution', value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                label="Nom du Formateur / Professeur"
                value={professorName}
                onChange={(e) => handleChange('professorName', e.target.value)}
                placeholder="Ex: Jean Dupont"
                error={errors.professorName}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                }
              />
              
              <div className="ml-6">
                <Checkbox
                  label="Afficher le nom du formateur"
                  checked={showProfessorName}
                  onChange={(value) => handleChange('showProfessorName', value)}
                />
              </div>
            </div>
            
            <NumberInput
              label="Nombre Maximum de Participants"
              value={maxParticipants}
              onChange={(value) => handleChange('maxParticipants', value)}
              min={2}
              max={1000}
              error={errors.maxParticipants}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              }
            />
          </div>
        </div>
        
        <div className="second-level-block p-6 rounded-xl space-y-6">
          <h3 className="text-lg font-semibold font-bricolage border-b pb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            Identité Visuelle
          </h3>
          
          <div className="space-y-4">
            <ImageSelector
              label="Logo de Professeur / Avatar"
              selectedImageId={selectedImage}
              onChange={(value) => handleChange('selectedImage', value)}
              onFileUpload={handleFileUpload}
              userAvatarUrl={userProfile?.avatar_url || null}
              useUserAvatar={useProfileAvatar}
              onUseUserAvatarChange={(use) => handleChange('useProfileAvatar', use)}
              helpText="Choisissez une image ou utilisez votre avatar de profil"
            />

            <div className="mt-6">
              <ImageSelector
                label="Logo d'entreprise/programme"
                selectedImageId={companyLogo}
                onChange={(value) => handleChange('companyLogo', value)}
                onFileUpload={handleFileUpload}
                helpText="Logo de l'entreprise ou du programme à afficher dans la session"
              />
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-yellow-800">Conseil</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Pour une expérience optimale, assurez-vous que toutes les informations sont correctes 
                  avant de procéder. Ces informations seront visibles en tête de session pour tous les participants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep; 