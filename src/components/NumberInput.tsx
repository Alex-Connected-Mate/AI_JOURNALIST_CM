import React from 'react';

interface NumberInputProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  min = 1,
  max = 1000,
  step = 1,
  onChange,
}) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    
    if (isNaN(newValue)) {
      onChange(min);
    } else {
      // Ensure value is within min and max
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center">
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-l-md text-gray-700 hover:bg-gray-200"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          -
        </button>
        
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="h-10 w-20 border-t border-b border-gray-300 px-3 py-2 text-center focus:outline-none focus:ring-0 focus:border-gray-300"
        />
        
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-200"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default NumberInput; 