import React, { useState } from 'react';

// Common emojis that could be relevant for an educational context
const COMMON_EMOJIS = [
  '🎓', '📚', '📝', '✏️', '📊', '💡', '🔬', '🧪',
  '🧠', '🤓', '👨‍🏫', '👩‍🏫', '👨‍🎓', '👩‍🎓', '🏫', '🧮',
  '⚡', '🚀', '🌟', '🔍', '📈', '🔔', '📣', '🏆'
];

interface EmojiPickerProps {
  label?: string;
  selectedEmoji: string;
  onChange: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  label,
  selectedEmoji,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // For a real app, you might want to implement a search functionality
  // This is just a simple grid display for now
  
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="bg-white border border-gray-300 rounded-md mb-2">
        <div className="p-2 border-b border-gray-200 flex items-center">
          <div 
            className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-xl mr-2"
          >
            {selectedEmoji}
          </div>
          <span className="text-sm text-gray-600">Selected Emoji</span>
        </div>
        
        <div className="p-2 grid grid-cols-6 gap-2">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`w-full h-8 flex items-center justify-center rounded-md ${
                selectedEmoji === emoji ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-gray-100'
              }`}
              onClick={() => onChange(emoji)}
            >
              <span className="text-xl">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Selected emoji will appear alongside your session information.
      </div>
    </div>
  );
};

export default EmojiPicker; 