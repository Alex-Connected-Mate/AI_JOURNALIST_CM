import React, { useId } from 'react';

/**
 * RadioGroup Component
 * 
 * A group of radio buttons for selecting a single option from multiple choices.
 * 
 * @param {Object} props Component properties
 * @param {string} props.label Label for the radio group
 * @param {Array} props.options Array of option objects with { value, label, description }
 * @param {string} props.value Currently selected value
 * @param {function} props.onChange Function called when selection changes
 * @param {string} props.name Name for the radio inputs (optional)
 * @param {boolean} props.disabled Whether the radio group is disabled (optional)
 */
const RadioGroup = ({
  label,
  options,
  value,
  onChange,
  name: providedName,
  disabled = false
}) => {
  const baseId = useId();
  const name = providedName || baseId;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {options.map((option) => {
          const id = `${baseId}-${option.value}`;
          const isSelected = value === option.value;
          
          return (
            <div 
              key={option.value} 
              className={`
                relative rounded-lg border p-4 cursor-pointer 
                ${isSelected 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && onChange(option.value)}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    id={id}
                    name={name}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange(option.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={disabled}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={id} className="font-medium text-gray-700 cursor-pointer">
                    {option.label}
                  </label>
                  {option.description && (
                    <p className="text-gray-500 mt-1">
                      {option.description}
                    </p>
                  )}
                  {option.icon && (
                    <div className="mt-2">
                      {option.icon}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

module.exports = RadioGroup; 