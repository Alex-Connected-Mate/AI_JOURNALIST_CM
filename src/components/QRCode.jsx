import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * QRCode Component
 * 
 * Displays a QR code for a given value with built-in error handling
 * and loading states.
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - The value to encode in the QR code
 * @param {number} props.size - Size of the QR code in pixels (optional, default: 128)
 * @param {string} props.bgColor - Background color (optional, default: white)
 * @param {string} props.fgColor - Foreground color (optional, default: black)
 * @param {number} props.level - Error correction level (optional, default: "M")
 * @param {React.ReactNode} props.logo - Optional logo to display in the center of the QR code
 * @param {string} props.className - Additional CSS classes for the component
 */
const QRCode = ({
  value,
  size = 128,
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = "M",
  logo = null,
  className = "",
}) => {
  // Skip rendering if no value is provided
  if (!value) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', padding: '12px', color: '#6b7280' }}>
          <div style={{ marginBottom: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M8 12h8"></path>
              <path d="M12 8v8"></path>
            </svg>
          </div>
          <p style={{ fontSize: '12px' }}>
            En attente de l'URL
          </p>
        </div>
      </div>
    );
  }

  try {
    // Ensure value is a string
    const safeValue = typeof value === 'string' ? value : String(value);
    
    return (
      <div className={`relative ${className}`}>
        <QRCodeSVG
          value={safeValue}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          includeMargin={true}
        />
        
        {logo && (
          <div 
            className="absolute" 
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '5px',
              backgroundColor: '#fff',
              borderRadius: '4px',
            }}
          >
            {logo}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Failed to render QR code:', error);
    
    // Fallback rendering in case of error
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', padding: '12px', color: '#b91c1c' }}>
          <div style={{ marginBottom: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p style={{ fontSize: '12px' }}>
            Erreur lors de la génération du QR code
          </p>
        </div>
      </div>
    );
  }
};

export default QRCode; 