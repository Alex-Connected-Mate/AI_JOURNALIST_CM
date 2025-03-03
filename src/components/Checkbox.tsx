import React from 'react';
import { useId } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  className = '',
  id,
  description,
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = id || `checkbox-${generatedId}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };
  
  return (
    <div className="relative flex items-start mb-3">
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className={`
            h-5 w-5 rounded 
            border-gray-300 text-blue-600 
            focus:ring-blue-500 focus:ring-offset-1
            transition-colors duration-200
            ${props.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            ${className}
          `}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label 
          htmlFor={checkboxId} 
          className={`font-medium text-gray-700 ${props.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </label>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
      
      {checked && (
        <div className="absolute -right-1 -top-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Checkbox; 