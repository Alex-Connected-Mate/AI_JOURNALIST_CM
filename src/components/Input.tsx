import React, { forwardRef } from 'react';
import { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={`relative rounded-lg ${icon ? 'flex items-center' : ''}`}>
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          ref={ref}
          className={`cm-input transition-all duration-200 ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'
          } ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${
            icon && iconPosition === 'right' ? 'pr-10' : ''
          } ${className}`}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-500">
            {icon}
          </div>
        )}
      </div>
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <div className="mt-1 p-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;