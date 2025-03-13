'use client';

import React from 'react';

/**
 * Composant DotPattern - Motif de points pour les arrière-plans
 * @param {Object} props - Propriétés du composant
 * @param {string} [props.className] - Classes CSS supplémentaires
 * @param {string} [props.dotColor] - Couleur des points (format HEX, RGB ou nom de couleur)
 * @param {number} [props.dotSize] - Taille des points en pixels
 * @param {number} [props.spacing] - Espacement entre les points en pixels
 * @returns {JSX.Element} Le composant DotPattern
 */
export default function DotPattern({
  className = '',
  dotColor = 'rgba(0, 0, 0, 0.1)',
  dotSize = 1,
  spacing = 20,
}) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent 0)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        backgroundPosition: '0 0',
        opacity: 0.8,
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
} 