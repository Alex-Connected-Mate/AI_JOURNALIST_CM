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
  // Si la valeur est undefined ou vide, afficher un placeholder
  if (!value) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Génération du QR code...</p>
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