import React from 'react';

interface InputProps {
  label: string;
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  type?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  value = '', 
  onChange, 
  placeholder, 
  required, 
  icon, 
  type = "text",
  disabled
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
          icon ? 'pl-10' : ''
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

export default Input;