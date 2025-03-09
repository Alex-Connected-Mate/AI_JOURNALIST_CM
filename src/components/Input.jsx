import React, { useState, useEffect } from 'react';

/**
 * Input Component
 * 
 * A reusable input field component with optional label, icon, and error message.
 * Now with improved validation handling for better typing experience.
 */

const Input = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error = null,
  icon = null,
  className = '',
  onValidate,
  ...domProps
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    setInternalError(error);
  }, [error]);

  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const handleValidation = async (newValue) => {
    if (!onValidate) return;

    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      try {
        const result = await onValidate(newValue);
        setInternalError(result.isValid ? null : result.message);
      } catch (err) {
        console.error('Validation error:', err);
        setInternalError(null);
      } finally {
        setIsValidating(false);
      }
    }, 1000);

    setValidationTimeout(timeoutId);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setInternalError(null);
    onChange(e);
    
    if (onValidate) {
      handleValidation(newValue);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (domProps.onBlur) {
      domProps.onBlur(e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (domProps.onFocus) {
      domProps.onFocus(e);
    }
  };

  const inputProps = { ...domProps };
  delete inputProps.onValidate;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          {...inputProps}
          type={type}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full rounded-md shadow-sm
            transition-all duration-200
            ${icon ? 'pl-10' : 'pl-3'}
            ${internalError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : isFocused
                ? 'border-purple-500 ring-1 ring-purple-500'
                : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
            }
            ${isValidating ? 'bg-gray-50' : 'bg-white'}
            ${className}
          `}
          aria-invalid={internalError ? 'true' : 'false'}
          aria-describedby={internalError ? `${label}-error` : undefined}
        />
        
        {isValidating && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      
      {internalError && (
        <p className="mt-1 text-sm text-red-600 transition-opacity duration-200" id={`${label}-error`}>
          {internalError}
        </p>
      )}
    </div>
  );
};

export default Input; 