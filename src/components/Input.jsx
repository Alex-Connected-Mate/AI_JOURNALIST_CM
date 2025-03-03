import React from 'react';

/**
 * Input Component
 * 
 * A reusable input field component with optional label, icon, and error message.
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
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
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
          type={type}
          value={value}
          onChange={onChange}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            ${icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          `}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${label}-error` : undefined}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${label}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input; 