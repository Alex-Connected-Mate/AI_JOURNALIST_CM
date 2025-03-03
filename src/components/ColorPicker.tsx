import React from 'react';

const PRESET_COLORS = [
  '#3490dc',  // blue
  '#38a169',  // green
  '#805ad5',  // purple
  '#d69e2e',  // yellow
  '#e53e3e',  // red
  '#dd6b20',  // orange
  '#718096',  // gray
  '#1a202c',  // dark
];

interface ColorPickerProps {
  label?: string;
  selectedColor: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  selectedColor,
  onChange,
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-4 gap-2 mb-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`h-8 w-full rounded-md border ${
              selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-500' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      
      <div className="flex items-center mt-2">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 p-0 border-0"
        />
        <span className="ml-2 text-sm text-gray-500">
          or select a custom color
        </span>
      </div>
    </div>
  );
};

export default ColorPicker; 