import React from 'react';
import { useId } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: Option[];
  onChange: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  value,
  onChange,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input w-full ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        value={value}
        onChange={handleChange}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select; 