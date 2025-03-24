const React = require('react');
const { QRCodeSVG } = require('qrcode.react');

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

module.exports = QRCode; 