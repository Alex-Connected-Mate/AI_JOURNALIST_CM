import React, { useId, useState, useEffect } from 'react';

/**
 * NumberInput Component
 * 
 * A numeric input component with increment and decrement buttons.
 * Styled to match the bento design system.
 * 
 * @param {Object} props Component properties
 * @param {string} props.label Label for the input
 * @param {number} props.value Current numeric value
 * @param {function} props.onChange Function called when value changes
 * @param {number} props.min Minimum allowed value (default: 0)
 * @param {number} props.max Maximum allowed value (default: 100)
 * @param {number} props.step Step value for increments/decrements (default: 1)
 * @param {boolean} props.disabled Whether the input is disabled
 * @param {string} props.error Error message to display
 * @param {ReactNode} props.icon Optional icon to display before the label
 */
const NumberInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  error = '',
  icon = null,
}) => {
  const id = useId();
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Convert to number and update parent if it's a valid number
    if (newValue === '' || !isNaN(newValue)) {
      const numValue = newValue === '' ? min : Number(newValue);
      if (numValue >= min && numValue <= max) {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    let numValue = Number(localValue);
    
    // Make sure the value is within bounds on blur
    if (isNaN(numValue)) {
      numValue = min;
    } else {
      numValue = Math.max(min, Math.min(numValue, max));
    }
    
    setLocalValue(numValue.toString());
    onChange(numValue);
  };

  const increment = () => {
    if (disabled) return;
    
    const numValue = Number(localValue);
    if (!isNaN(numValue) && numValue < max) {
      const newValue = Math.min(numValue + step, max);
      setLocalValue(newValue.toString());
      onChange(newValue);
    }
  };

  const decrement = () => {
    if (disabled) return;
    
    const numValue = Number(localValue);
    if (!isNaN(numValue) && numValue > min) {
      const newValue = Math.max(numValue - step, min);
      setLocalValue(newValue.toString());
      onChange(newValue);
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <div className="flex items-center mb-1">
          {icon && <span className="mr-2 text-gray-500">{icon}</span>}
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        </div>
      )}
      
      <div className="flex rounded-xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || Number(localValue) <= min}
          className={`
            inline-flex items-center justify-center px-3 py-2
            border border-r-0 border-gray-200 
            ${disabled || Number(localValue) <= min
              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors'}
          `}
          aria-label="Décrement"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        
        <input
          type="text"
          id={id}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            block w-full min-w-0 flex-1 px-3 py-2
            border-y border-gray-200
            focus:ring-blue-500 focus:border-blue-500
            text-center font-medium
            ${error ? 'border-red-300' : ''}
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}
          `}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        <button
          type="button"
          onClick={increment}
          disabled={disabled || Number(localValue) >= max}
          className={`
            inline-flex items-center justify-center px-3 py-2
            border border-l-0 border-gray-200
            ${disabled || Number(localValue) >= max
              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors'}
          `}
          aria-label="Incrément"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Range indicator */}
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
        <span>{min}</span>
        <span className="text-gray-400">Valeur actuelle: {localValue}</span>
        <span>{max}</span>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default NumberInput; 