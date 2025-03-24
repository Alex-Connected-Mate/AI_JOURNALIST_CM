'use client';

const React = require('react');

/**
 * Composant DotPattern - Motif de points pour les arrière-plans
 * @param {Object} props - Propriétés du composant
 * @param {string} [props.className] - Classes CSS supplémentaires
 * @param {string} [props.dotColor] - Couleur des points (format HEX, RGB ou nom de couleur)
 * @param {number} [props.dotSize] - Taille des points en pixels
 * @param {number} [props.spacing] - Espacement entre les points en pixels
 * @returns {JSX.Element} Le composant DotPattern
 */
const DotPattern = ({ className = '', ...props }) => {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <pattern
          id="dotPattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotPattern)" />
    </svg>
  );
};

export default DotPattern; 