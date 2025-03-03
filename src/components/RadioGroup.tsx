import React from 'react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  name,
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {options.map((option) => (
          <div 
            key={option.value}
            className={`border rounded-md p-3 relative ${
              value === option.value 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <label className="flex items-start cursor-pointer">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm">
                <p className="font-medium text-gray-700">{option.label}</p>
                {option.description && (
                  <p className="text-gray-500">{option.description}</p>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadioGroup; 