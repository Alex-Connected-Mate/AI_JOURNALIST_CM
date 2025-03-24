const React = require('react');

/**
 * Input Component - Simplified Version
 * 
 * A basic input field with no real-time validation to ensure smooth typing experience.
 * All validation is deferred to form submission.
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
  ...domProps
}) => {
  // Simple handler that just passes the event to the parent component
  const handleChange = (e) => {
    onChange(e);
  };

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
          {...domProps}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full rounded-md shadow-sm
            transition-all duration-200
            ${icon ? 'pl-10' : 'pl-3'}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
            }
            bg-white
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${label}-error` : undefined}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${label}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

module.exports = Input; 