import React from 'react';
import Image from 'next/image';

// For a real app, you would have a proper set of images to choose from
// These are just placeholders for the demo
const IMAGE_OPTIONS = [
  { id: 'university', label: 'University Logo', src: '/placeholder-university.png' },
  { id: 'school', label: 'School Image', src: '/placeholder-school.png' },
  { id: 'professor', label: 'Professor Photo', src: '/placeholder-professor.png' },
  { id: 'client', label: 'Client Image', src: '/placeholder-client.png' },
  { id: 'custom', label: 'Custom Image', src: '/placeholder-custom.png' },
];

interface ImageSelectorProps {
  label?: string;
  selectedImageId: string;
  onChange: (imageId: string) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({
  label,
  selectedImageId,
  onChange,
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
        {IMAGE_OPTIONS.map((image) => (
          <button
            key={image.id}
            type="button"
            className={`border rounded-md p-3 flex flex-col items-center ${
              selectedImageId === image.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onChange(image.id)}
          >
            <div className="relative w-full h-20 mb-2 bg-gray-100 rounded overflow-hidden">
              {/* In a real app, you'd use actual images here */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                {/* This is just a placeholder. In a real app, use Image component */}
                <span className="text-3xl">{image.id === 'university' ? '🏫' : 
                                             image.id === 'school' ? '🎓' :
                                             image.id === 'professor' ? '👨‍🏫' :
                                             image.id === 'client' ? '🏢' : '🖼️'}</span>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">{image.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        This image will be displayed at the top of the session.
      </div>
    </div>
  );
};

export default ImageSelector; 