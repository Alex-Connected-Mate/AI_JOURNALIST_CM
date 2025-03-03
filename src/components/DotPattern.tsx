import React from 'react';

interface DotPatternProps {
  className?: string;
}

const DotPattern: React.FC<DotPatternProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${className}`} aria-hidden="true">
      {/* Le pattern de points est maintenant géré par le CSS global */}
    </div>
  );
};

export default DotPattern; 