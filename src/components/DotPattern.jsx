import React from 'react';

/**
 * Composant de motif de points pour l'arrière-plan
 * @param {Object} props
 * @param {string} props.className - Classes CSS additionnelles
 */
const DotPattern = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${className}`} aria-hidden="true">
      {/* Le pattern de points est maintenant géré par le CSS global */}
    </div>
  );
};

export default DotPattern; 