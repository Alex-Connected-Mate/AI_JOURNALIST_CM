import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface ImageUploaderProps {
  bucket: 'ai-agent' | 'session-logo' | 'user-pp';
  defaultImage?: string;
  onImageUploaded: (url: string) => void;
  className?: string;
  buttonText?: string;
  filePrefix?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'rounded' | 'circle';
  resetButton?: boolean;
  onReset?: () => void;
  resetButtonText?: string;
}

/**
 * Composant réutilisable pour télécharger des images vers Supabase
 * 
 * Prend en charge différents buckets, tailles, formes, et options de réinitialisation
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  bucket,
  defaultImage,
  onImageUploaded,
  className = '',
  buttonText = 'Modifier',
  filePrefix = 'file',
  size = 'md',
  shape = 'rounded',
  resetButton = false,
  onReset,
  resetButtonText = 'Réinitialiser'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Déterminer les classes CSS en fonction des props
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-60 h-60'
  };

  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-md',
    circle: 'rounded-full'
  };

  // Couleurs de bouton en fonction du bucket
  const buttonColors = {
    'ai-agent': 'bg-blue-500 hover:bg-blue-600',
    'session-logo': 'bg-purple-500 hover:bg-purple-600',
    'user-pp': 'bg-green-500 hover:bg-green-600'
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Le fichier sélectionné n\'est pas une image');
      return;
    }
    
    // Valider la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('L\'image est trop volumineuse (max 2MB)');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    // Créer un aperçu local immédiat
    setPreview(URL.createObjectURL(file));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${filePrefix}-${Date.now()}.${fileExt}`;
      
      console.log(`Téléchargement de l'image vers le bucket "${bucket}"...`);
      
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });
        
      if (error) {
        console.error('Erreur lors du téléchargement:', error);
        throw error;
      }
      
      console.log('Image téléchargée avec succès:', data);
      
      const { data: urlData } = await supabase
        .storage
        .from(bucket)
        .getPublicUrl(fileName);
        
      console.log('URL publique générée:', urlData.publicUrl);
      
      onImageUploaded(urlData.publicUrl);
    } catch (error: any) {
      console.error('Erreur complète:', error);
      setError(error.message || 'Échec du téléchargement');
      
      // Revenir à l'image par défaut en cas d'erreur
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setPreview(null);
  };
  
  // Détermine l'image à afficher (priorité au preview temporaire)
  const displayImage = preview || defaultImage;
  
  return (
    <div className={`image-uploader ${className}`}>
      {displayImage && (
        <div className={`preview-container mb-4 relative ${sizeClasses[size]} overflow-hidden mx-auto border-4 border-gray-200`}>
          <div className={`w-full h-full ${shapeClasses[shape]}`}>
            <Image 
              src={displayImage} 
              alt="Aperçu"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <label 
          className={`cursor-pointer px-3 py-2 ${buttonColors[bucket]} text-white rounded text-sm text-center flex-1 flex items-center justify-center ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Téléchargement...
            </>
          ) : buttonText}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
        
        {resetButton && displayImage && (
          <button 
            onClick={handleReset}
            disabled={isUploading}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm disabled:opacity-50"
            type="button"
          >
            {resetButtonText}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 