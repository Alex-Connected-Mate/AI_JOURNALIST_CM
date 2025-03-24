const React = require('react');
const PropTypes = require('prop-types');

/**
 * UserBlock Component
 * 
 * A unified display component for user profiles across the application.
 * Adapts to different anonymity levels while maintaining consistent design.
 * Used in session creation, professor presentations, and participant voting interfaces.
 */
const UserBlock = ({ 
  type = 'anonymous', 
  emoji = '😶‍🌫️',
  color = '#EAAEFF',
  name = '',
  id = '',
  profileImage = '',
  enableColors = true,
  size = 'normal',
  onClick = null
}) => {
  // Determine avatar content based on type
  const renderAvatarContent = () => {
    if (type === 'identified' && profileImage) {
      return (
        <img 
          src={profileImage}
          alt={`${name}'s profile`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
          }}
        />
      );
    } else {
      return (
        <div 
          style={{
            width: '29px', 
            height: '29px', 
            textAlign: 'center', 
            justifyContent: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            color: 'black', 
            fontSize: '32px', 
            fontFamily: 'Bricolage Grotesque, sans-serif', 
            fontWeight: 600, 
            lineHeight: '12.90px',
            wordWrap: 'break-word'
          }}
        >
          {emoji}
        </div>
      );
    }
  };

  // Determine identifier label content
  const renderIdentifierContent = () => {
    if (type === 'identified') {
      return name;
    } else if (type === 'semi-anonymous') {
      return name || 'Username';
    } else {
      // For anonymous and fully-anonymous types
      return id.startsWith('#') ? id : `#${id}`;
    }
  };

  // Background color for avatar and identifier
  const bgColor = enableColors ? color : '#000000';

  // Size classes
  const sizeClasses = {
    small: {
      container: 'w-[90px] p-2',
      avatar: 'w-6 h-6 text-xl',
      label: 'text-[10px]'
    },
    normal: {
      container: 'w-[122px] p-[10px]',
      avatar: 'w-[29px] h-[29px] text-3xl',
      label: 'text-[12.9px]'
    },
    large: {
      container: 'w-[150px] p-4',
      avatar: 'w-10 h-10 text-4xl',
      label: 'text-sm'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.normal;

  return (
    <div 
      className={`UserBlock ${currentSize.container} bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.15)] rounded-[13px] flex flex-col justify-start items-center gap-[10px] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Avatar Container */}
      <div 
        className="Avatar p-[10px] overflow-hidden rounded-[9.39px] flex flex-col justify-start items-start gap-[10px]"
        style={{
          background: bgColor,
          boxShadow: '0px 1.96px 3.92px rgba(35, 39, 46, 0.08)',
          outline: '2.51px white solid',
          outlineOffset: '-2.51px'
        }}
      >
        {renderAvatarContent()}
      </div>

      {/* Identifier Label */}
      <div 
        className="py-[2px] overflow-hidden inline-flex justify-start items-start"
        style={{
          background: type === 'identified' ? '#f0f9ff' : (type === 'semi-anonymous' ? '#f9fafb' : bgColor),
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          outline: type === 'identified' || type === 'semi-anonymous' ? '1px #e5e7eb solid' : '1px black solid',
          outlineOffset: '-1px'
        }}
      >
        <div 
          className="w-[102px] flex flex-col justify-start items-start"
          style={{ boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.25)' }}
        >
          <div 
            className={`self-stretch text-center flex justify-center flex-col font-semibold leading-[12.9px] ${currentSize.label}`}
            style={{
              fontFamily: 'Bricolage Grotesque, system-ui, sans-serif',
              color: type === 'identified' || type === 'semi-anonymous' ? '#23272E' : 'white',
              wordWrap: 'break-word'
            }}
          >
            {renderIdentifierContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

UserBlock.propTypes = {
  type: PropTypes.oneOf(['identified', 'semi-anonymous', 'anonymous', 'fully-anonymous']),
  emoji: PropTypes.string,
  color: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  profileImage: PropTypes.string,
  enableColors: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  onClick: PropTypes.func
};

module.exports = UserBlock; 