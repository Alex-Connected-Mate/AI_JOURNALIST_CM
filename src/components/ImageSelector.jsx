const React = require('react');

/**
 * ImageSelector Component
 * 
 * A component for selecting an image from a predefined list of options.
 */
const ImageSelector = ({
  label,
  selectedImageId,
  onChange,
  disabled = false
}) => {
  // Predefined image options
  const imageOptions = [
    {
      id: 'university',
      label: 'Université',
      icon: '🏛️',
      preview: 'https://via.placeholder.com/80/e2e8f0/64748b?text=Université',
    },
    {
      id: 'corporate',
      label: 'Entreprise',
      icon: '🏢',
      preview: 'https://via.placeholder.com/80/e2e8f0/64748b?text=Entreprise',
    },
    {
      id: 'school',
      label: 'École',
      icon: '🏫',
      preview: 'https://via.placeholder.com/80/e2e8f0/64748b?text=École',
    },
    {
      id: 'government',
      label: 'Gouvernement',
      icon: '🏛️',
      preview: 'https://via.placeholder.com/80/e2e8f0/64748b?text=Gouvernement',
    },
    {
      id: 'conference',
      label: 'Conférence',
      icon: '🎤',
      preview: 'https://via.placeholder.com/80/e2e8f0/64748b?text=Conférence',
    },
    {
      id: 'workshop',
      label: 'Atelier',
      icon: '🛠️',
      preview: 'https://via.placeholder.com/80/e2e8f0/64748b?text=Atelier',
    },
  ];

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-3 gap-3">
        {imageOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            disabled={disabled}
            className={`
              p-2 rounded-lg border text-center cursor-pointer transition-all
              ${selectedImageId === option.id 
                ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200 ring-opacity-50' 
                : 'border-gray-200 hover:bg-gray-50'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-1">{option.icon}</div>
              <div className="text-xs font-medium text-gray-600">{option.label}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Aperçu:</div>
        <div className="flex items-center">
          <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
            {imageOptions.find(opt => opt.id === selectedImageId)?.icon || '🏢'}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium">
              {imageOptions.find(opt => opt.id === selectedImageId)?.label || 'Image sélectionnée'}
            </div>
            <div className="text-xs text-gray-500">
              Cette image apparaîtra sur la page de la session
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

module.exports = ImageSelector; 