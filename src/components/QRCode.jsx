import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * QRCode Component
 * 
 * A wrapper around the qrcode.react library to display QR codes with custom styling.
 * 
 * @param {Object} props Component properties
 * @param {string} props.value The URL or text to encode in the QR code
 * @param {number} props.size Size of the QR code in pixels (default: 128)
 * @param {string} props.bgColor Background color (default: "#ffffff")
 * @param {string} props.fgColor Foreground color (default: "#000000")
 * @param {number} props.level Error correction level (default: "L")
 * @param {React.ReactNode} props.logo Optional logo to display in the center of the QR code
 */
const QRCode = ({
  value,
  size = 128,
  bgColor = "#ffffff",
  fgColor = "#000000",
  level = "L",
  logo = null,
  className = "",
}) => {
  // Si value est undefined, null, vide ou non-string, retourner un placeholder
  if (!value || typeof value !== 'string' || value.trim() === '') {
    // Utiliser des classes fixes au lieu de w-${size} pour éviter des problèmes de purge CSS
    const sizeStyle = { width: `${size}px`, height: `${size}px` };
    
    return (
      <div 
        className={`border border-dashed border-gray-300 rounded flex items-center justify-center ${className}`}
        style={sizeStyle}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <span className="text-gray-500 text-sm">QR Code en préparation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <QRCodeSVG
        value={value}
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
};

export default QRCode; 