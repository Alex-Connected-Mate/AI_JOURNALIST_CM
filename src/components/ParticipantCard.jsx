import React from 'react';

const ParticipantCard = ({ 
  name,
  anonymousId, 
  profileImage, 
  emoji, 
  color = '#EAAEFF', 
  isSelected = false,
  onClick = null, 
}) => {
  // Utiliser soit le nom réel, soit l'ID anonyme
  const displayName = name || `#${anonymousId}`;
  
  // Déterminer si on utilise une image ou un emoji avec couleur
  const hasImage = profileImage && profileImage.length > 0;
  
  return (
    <div 
      data-layer="USER-BLOCK" 
      className={`UserBlock ${isSelected ? 'selected' : ''} ${onClick ? 'clickable' : ''}`}
      style={{
        width: 122, 
        height: hasImage ? 114 : 96, 
        padding: 10, 
        background: 'white', 
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.15)', 
        borderRadius: 13, 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        gap: 10, 
        display: 'inline-flex',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {hasImage ? (
        // Version avec image
        <div data-layer="avatar" className="Avatar" style={{position: 'relative'}}>
          <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <g filter="url(#filter0_d_participant)">
              <rect x="4" y="2" width="54" height="54" rx="9.39073" fill={`url(#pattern0_participant)`} shapeRendering="crispEdges"/>
              <rect x="5.25581" y="3.25581" width="51.4884" height="51.4884" rx="8.13492" stroke="white" strokeWidth="2.51163" shapeRendering="crispEdges"/>
            </g>
            <defs>
              <filter id="filter0_d_participant" x="0.0751224" y="0.0375612" width="61.8498" height="61.8498" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="1.96244"/>
                <feGaussianBlur stdDeviation="1.96244"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.137255 0 0 0 0 0.152941 0 0 0 0 0.180392 0 0 0 0.08 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_participant"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_participant" result="shape"/>
              </filter>
              <pattern id="pattern0_participant" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlinkHref="#image0_participant" transform="scale(0.00390625)"/>
              </pattern>
              <image id="image0_participant" width="256" height="256" xlinkHref={profileImage} />
            </defs>
          </svg>
        </div>
      ) : (
        // Version avec emoji et couleur
        <div 
          data-layer="avatar" 
          className="Avatar" 
          style={{
            padding: 10, 
            background: color, 
            boxShadow: '0px 1.9624388217926025px 3.924877643585205px rgba(35, 39, 46, 0.08)', 
            borderRadius: 9.39, 
            overflow: 'hidden', 
            border: '2.51px white solid', 
            flexDirection: 'column', 
            justifyContent: 'flex-start', 
            alignItems: 'flex-start', 
            gap: 10, 
            display: 'flex'
          }}
        >
          <div 
            data-layer="emoji" 
            style={{
              width: 29, 
              height: 29, 
              textAlign: 'center', 
              color: 'black', 
              fontSize: 32, 
              fontFamily: 'Bricolage Grotesque', 
              fontWeight: '600', 
              lineHeight: 12.90, 
              wordWrap: 'break-word'
            }}
          >
            {emoji || '😊'}
          </div>
        </div>
      )}
      
      {/* Affichage du nom - même design pour les deux variantes */}
      <div 
        data-layer="Frame 427322300" 
        className="NameFrame" 
        style={{
          paddingTop: 2, 
          paddingBottom: 2, 
          background: color, 
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', 
          border: '1px black solid', 
          justifyContent: 'flex-start', 
          alignItems: 'flex-start', 
          display: 'inline-flex'
        }}
      >
        <div 
          data-layer="content" 
          className="Content" 
          style={{
            width: 102, 
            alignSelf: 'stretch', 
            boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.25)', 
            flexDirection: 'column', 
            justifyContent: 'flex-start', 
            alignItems: 'flex-start', 
            display: 'inline-flex'
          }}
        >
          <div 
            data-layer="name" 
            className="ParticipantName" 
            style={{
              alignSelf: 'stretch', 
              textAlign: 'center', 
              color: '#23272E', 
              fontSize: 12.90, 
              fontFamily: 'Bricolage Grotesque', 
              fontWeight: '600', 
              lineHeight: 12.90, 
              wordWrap: 'break-word'
            }}
          >
            {displayName}
          </div>
        </div>
      </div>
      
      {/* Styles CSS pour les interactions */}
      <style jsx>{`
        .UserBlock.selected {
          box-shadow: 0px 0px 0px 2px #4A6CF7, 0px 1px 3px rgba(0, 0, 0, 0.15);
        }
        
        .UserBlock.clickable:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ParticipantCard; 