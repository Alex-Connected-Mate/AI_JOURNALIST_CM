import React, { ChangeEvent, useState } from 'react';

export interface InputProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  validate?: (value: string) => Promise<{ isValid: boolean; message: string }> | { isValid: boolean; message: string };
}

const InputComponent: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
  required = false,
  error = '',
  validate
}) => {
  const [internalError, setInternalError] = useState('');
  
  // Only validate when the user leaves the field, not during typing
  const handleBlur = async () => {
    if (validate) {
      try {
        const result = await validate(value);
        setInternalError(result.message);
      } catch (err) {
        // Handle any errors in validation
        console.error("Validation error:", err);
      }
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm 
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${(error || internalError) ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 
                   'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}
          placeholder-gray-400
          focus:outline-none focus:ring-2
          transition duration-150 ease-in-out
        `}
      />
      {(error || internalError) && (
        <p className="mt-1 text-sm text-red-600">{error || internalError}</p>
      )}
    </div>
  );
};

export default InputComponent;