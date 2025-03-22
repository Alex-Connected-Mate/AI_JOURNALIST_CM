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
  // Si aucune valeur n'est fournie, afficher un placeholder
  if (!value) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <span className="text-gray-500 text-sm">Génération du QR code...</span>
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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded"
          style={{
            width: size * 0.25,
            height: size * 0.25,
          }}
        >
          {logo}
        </div>
      )}
    </div>
  );
};

export default QRCode; 