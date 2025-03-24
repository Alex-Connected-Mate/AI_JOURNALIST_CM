import React, { useId } from 'react';

/**
 * Checkbox Component
 * 
 * A reusable checkbox component with label and description.
 */
const Checkbox = ({
  label,
  checked,
  onChange,
  description = '',
  disabled = false,
  className = '',
  ...props
}) => {
  const id = useId();

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`
            h-4 w-4 rounded border-gray-300 text-blue-600 
            focus:ring-blue-500 focus:ring-offset-0
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label 
          htmlFor={id} 
          className={`font-medium text-gray-700 ${!disabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
        >
          {label}
        </label>
        {description && (
          <p className="text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
};

module.exports = Checkbox; 