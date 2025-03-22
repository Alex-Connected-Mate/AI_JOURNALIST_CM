// This file re-exports the QRCode component from QRCode.jsx for TypeScript compatibility
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

type QRCodeProps = {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
  logo?: React.ReactNode;
  className?: string;
};

/**
 * QRCode Component
 * 
 * A wrapper around the qrcode.react library to display QR codes with custom styling.
 */
const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 128,
  bgColor = "#ffffff",
  fgColor = "#000000",
  level = "L",
  logo = null,
  className = "",
}) => {
  // If no value is provided, return empty div
  if (!value) {
    return <div className={`w-${size} h-${size} border border-dashed border-gray-300 rounded flex items-center justify-center ${className}`}>
      <span className="text-gray-400 text-sm">QR Code sera généré</span>
    </div>;
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