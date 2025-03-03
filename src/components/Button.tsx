import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn flex items-center justify-center transition-all duration-200';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400'
  };
  
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
    isLoading ? 'opacity-70 cursor-not-allowed' : ''
  }`;
  
  return (
    <button 
      className={classes} 
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin mr-2"></div>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button; 