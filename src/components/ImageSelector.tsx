import React, { useRef } from 'react';

interface ImageSelectorProps {
  label: string;
  selectedImageId: string | null;
  onChange: (value: string | null) => void;
  helpText?: string;
  onFileUpload: (file: File) => Promise<void>;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ 
  label, 
  selectedImageId, 
  onChange, 
  helpText, 
  onFileUpload 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div className="mt-1 flex items-center">
        {selectedImageId ? (
          <div className="relative">
            <img
              src={selectedImageId}
              alt="Selected"
              className="h-16 w-16 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="ml-4 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Changer
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFile(file);
            }
          }}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default ImageSelector; 