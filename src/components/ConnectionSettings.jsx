import React, { useState } from 'react';
import { useTranslation } from './LocaleProvider';

/**
 * ConnectionSettings Component
 * 
 * Allows configuration of user connection settings for a session,
 * including participant identification options and appearance settings.
 * Provides visual previews of how users will appear with different settings.
 */
const ConnectionSettings = ({ 
  config = {}, 
  onChange,
  errors = {}
}) => {
  const { t } = useTranslation ? useTranslation() : { t: (key) => key };
  const [selectedAnonymityLevel, setSelectedAnonymityLevel] = useState(
    config.anonymityLevel || 'semi-anonymous'
  );
  
  const [enableColors, setEnableColors] = useState(
    config.enableColors !== false // Default true
  );
  
  // Handle changes to form fields
  const handleChange = (field, value) => {
    onChange({ 
      ...config, 
      [field]: value 
    });
    
    // If changing anonymity level, update state
    if (field === 'anonymityLevel') {
      setSelectedAnonymityLevel(value);
    }
    
    // If changing color setting, update state
    if (field === 'enableColors') {
      setEnableColors(value);
    }
  };

  // Ensure translation keys return strings
  const safeT = (key, defaultValue) => {
    const result = t(key, defaultValue);
    return typeof result === 'string' ? result : defaultValue || key;
  };

  // Sample emojis for profiles
  const sampleEmojis = ['😶‍🌫️', '🦊', '🐼', '🦄', '🦁', '🐯'];
  
  // Sample colors for profiles
  const sampleColors = [
    '#EAAEFF', // Purple
    '#FFD166', // Yellow
    '#06D6A0', // Green
    '#118AB2', // Blue
    '#EF476F', // Pink
    '#000000'  // Black - available for users who don't want colors
  ];

  // Sample profile pictures for identified users
  const sampleProfilePics = [
    "/images/profile-placeholder-1.jpg",
    "/images/profile-placeholder-2.jpg",
    "/images/profile-placeholder-3.jpg"
  ];

  // Base64 encoded placeholder image for profile pictures (fallback)
  const placeholderImageBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIGZpbGw9IiMxYTFhMWEiLz48cGF0aCBkPSJNMTE1LjUsMNBhMTE1LjUsMTE1LjUsMCwxLDAsMCwyMzEsMTE1LjUsMTE1LjUsMCwwLDAsMC0yMzFabTAsNDJhNzMuNSw3My41LDAsMSwxLTczLjUsNzMuNUE3My41LDczLjUsMCwwLDEsMTE1LjUsNDJaIiBmaWxsPSIjMzMzIi8+PHBhdGggZD0iTTE1NCwyMzFIMTU0QzExNS41LDIzMSw3Nyw0NywzOC41LDAsNzcsMCwxMTUuNSw0MiwxNTQsNDJzNzctMzksNzcsMzlDMjMxLDQ3LDE5Mi41LDIzMSwxNTQsMjMxWiIgZmlsbD0iIzRkNGQ0ZCIvPjxwYXRoIGQ9Ik0xMTUuNSw0MmE3My41LDczLjUsMCwxLDAtLjA1LDE0N0E3My41LDczLjUsMCwwLDAsMTE1LjUsNDJaTTk2LjM2LDEzMS42MkExNS42MiwxNS42MiwwLDEsMSw5Ni4zNiwxMDAuMzhhMTUuNjIsMTUuNjIsMCwwLDEsMCwzMS4yNFptMzguMjgsMGExNS42MiwxNS42MiwwLDEsMS4wNS0zMS4yNEExNS42MiwxNS42MiwwLDAsMSwxMzQuNjQsMTMxLjYyWiIgZmlsbD0iIzFlMWUxZSIvPjxwYXRoIGQ9Ik0xNTQsMjMxSDc3TDM4LjUsMEwxNTQsNDJsMCwwTDMxLjA5LDEzMS42MiwxNTQsNDJsMzguNSwwTDczLjUsMTg5VjQyaDBjMCw0MC41OSw0MCw3My41LDgwLjUsNzMuNXM0MC0zMi45MSw0MC03My41QzE5Mi41LDIzMSwxNTQsMjMxLDE1NCwyMzFaIiBmaWxsPSIjNTk1OTU5Ii8+PHBhdGggZD0iTTExNS41LDAsMzguNSwwbDExNSw0NC44M0wzOC41LDBsNzcsMTg5TDc3LDBjMCw0MC41OSw4MCw3My41LDgwLDczLjVzLTgwLTMyLjkxLTgwLTczLjVoMGw3NywxODloMGMtMzguNSwwLTc3LTE4OS03Ny0xODlDMzgsNDMuNSw3Nyw4MCwxMTUuNSw4MHM3Ny41LTM2LjUsNzcuNS04MEM1OCw0My41LDExNS41LDAsMTE1LjUsMFoiIGZpbGw9IiM3MzczNzMiLz48cGF0aCBkPSJNOTYuMzYsMTAwLjM4YTE1LjYyLDE1LjYyLDAsMSwwLDMxLjI0LDBBMTUuNjIsMTUuNjIsMCwwLDAsOTYuMzYsMTAwLjM4WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xMzQuNjQsMTAwLjM4YTE1LjYyLDE1LjYyLDAsMSwwLDMxLjI0LDBBMTUuNjIsMTUuNjIsMCwwLDAsMTM0LjY0LDEwMC4zOFoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=";

  // Sample birth dates for anonymous IDs
  const sampleDates = ["16/12", "03/05", "27/09"];

  // Profile preview component
  const ProfilePreview = ({ type, emoji, color, name, id, profileImage }) => {
    // Common profile container for all types
    const containerClasses = "w-[122px] h-[96px] p-2.5 bg-white shadow-sm rounded-xl flex flex-col items-center justify-start gap-2.5";
    
    // Different content for the avatar box based on type
    let avatarBox;
    
    if (type === 'identified') {
      // Use actual profile image for identified users
      avatarBox = (
        <div 
          className="w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden border-2 border-white shadow-sm"
        >
          <img 
            src={profileImage || placeholderImageBase64}
            alt={`${name}'s profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
            }}
          />
        </div>
      );
    } else {
      // Use colored box with emoji for anonymous/semi-anonymous users
      avatarBox = (
        <div 
          className="w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden border-2 border-white shadow-sm"
          style={{ backgroundColor: enableColors ? color : '#000000' }}
        >
          <div className="text-center text-2xl leading-none">
            {emoji}
          </div>
        </div>
      );
    }

    // Different name tags based on type
    let nameTag;
    
    if (type === 'identified') {
      nameTag = (
        <div className="py-0.5 px-2 bg-blue-100 shadow-sm border border-gray-200 rounded">
          <div className="text-center text-gray-800 text-xs font-semibold">
            {name}
          </div>
        </div>
      );
    } else if (type === 'semi-anonymous') {
      nameTag = (
        <div className="py-0.5 px-2 shadow-sm border border-gray-200 bg-gray-50 rounded">
          <div className="w-full text-center text-gray-800 text-xs font-semibold">
            {name || "Username"}
          </div>
        </div>
      );
    } else { // fully anonymous
      // Extract the first letter (for family name), second letter (for first name), and birth date
      const idParts = id.split('/');
      const initials = idParts[0]; // "Cl" for example
      const birthdate = `${idParts[1]}/${idParts[2]}`; // "16/12" for example
      
      nameTag = (
        <div 
          className="py-0.5 px-2 shadow-sm border border-gray-800"
          style={{ backgroundColor: enableColors ? color : '#000000' }}
        >
          <div className="w-full text-center text-gray-100 text-xs font-semibold">
            {`${initials}-${birthdate}`}
          </div>
        </div>
      );
    }

    return (
      <div className={containerClasses}>
        {avatarBox}
        {nameTag}
      </div>
    );
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{safeT('connection.title', 'User Connection')}</h3>
      <p className="text-sm text-gray-600 mb-6">
        {safeT('connection.description', 'Define how users will connect and what information will be visible.')}
      </p>
      
      <div className="mb-6">
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {safeT('connection.anonymity_level', 'Participant Identification')}
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedAnonymityLevel === 'identified' 
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
              onClick={() => handleChange('anonymityLevel', 'identified')}
            >
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                    {selectedAnonymityLevel === 'identified' && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {safeT('connection.identified', 'Real Identity')}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                {safeT('connection.identified_desc', 'Participants appear with their real name and profile picture')}
              </p>
            </div>

            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedAnonymityLevel === 'semi-anonymous' 
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
              onClick={() => handleChange('anonymityLevel', 'semi-anonymous')}
            >
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                    {selectedAnonymityLevel === 'semi-anonymous' && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {safeT('connection.semi_anonymous', 'Semi-Anonymous')}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                {safeT('connection.semi_anonymous_desc', 'Participants choose a username and colored emoji')}
              </p>
            </div>

            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedAnonymityLevel === 'anonymous' 
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
              onClick={() => handleChange('anonymityLevel', 'anonymous')}
            >
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                    {selectedAnonymityLevel === 'anonymous' && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {safeT('connection.anonymous', 'Fully Anonymous')}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                {safeT('connection.anonymous_desc', 'Participants get auto-generated ID codes with complete privacy')}
              </p>
            </div>
          </div>
          
          {/* Profile previews */}
          <div className="mt-6 mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              {safeT('connection.preview_title', 'How participants will appear:')}
            </h4>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {selectedAnonymityLevel === 'identified' ? (
              <>
                <ProfilePreview 
                  type="identified" 
                  profileImage={sampleProfilePics[0]}
                  name="John Doe" 
                />
                <ProfilePreview 
                  type="identified" 
                  profileImage={sampleProfilePics[1]}
                  name="Sarah Smith" 
                />
                <ProfilePreview 
                  type="identified" 
                  profileImage={sampleProfilePics[2]}
                  name="Alex Wong" 
                />
              </>
            ) : selectedAnonymityLevel === 'semi-anonymous' ? (
              <>
                <ProfilePreview 
                  type="semi-anonymous" 
                  emoji={sampleEmojis[0]} 
                  color={sampleColors[0]} 
                  name="JazzCat" 
                />
                <ProfilePreview 
                  type="semi-anonymous" 
                  emoji={sampleEmojis[1]} 
                  color={sampleColors[1]} 
                  name="StarGazer" 
                />
                <ProfilePreview 
                  type="semi-anonymous" 
                  emoji={sampleEmojis[2]} 
                  color={sampleColors[2]} 
                  name="SkyRunner" 
                />
              </>
            ) : (
              <>
                <ProfilePreview 
                  type="anonymous" 
                  emoji={sampleEmojis[0]} 
                  color={sampleColors[0]} 
                  id="Cl/16/12" 
                />
                <ProfilePreview 
                  type="anonymous" 
                  emoji={sampleEmojis[1]} 
                  color={sampleColors[1]} 
                  id="Me/03/05" 
                />
                <ProfilePreview 
                  type="anonymous" 
                  emoji={sampleEmojis[2]} 
                  color={sampleColors[2]} 
                  id="Br/27/09" 
                />
              </>
            )}
          </div>
          
          {errors.anonymityLevel && <p className="mt-1 text-sm text-red-600">{errors.anonymityLevel}</p>}

          {/* Additional information about the anonymity level */}
          {selectedAnonymityLevel === 'identified' && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                {safeT('connection.identified_info', 'Profile Image Information')}
              </h5>
              <p className="text-xs text-gray-600">
                {safeT('connection.identified_info_desc', 'Participants who use real identity will appear with their actual profile pictures. Users will be able to upload their own profile photos when joining the session.')}
              </p>
            </div>
          )}

          {selectedAnonymityLevel === 'semi-anonymous' && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                {safeT('connection.semi_anonymous_info', 'Semi-Anonymous Details')}
              </h5>
              <p className="text-xs text-gray-600">
                {safeT('connection.semi_anonymous_info_desc', 'Participants will choose a username that will be displayed alongside their colored emoji. This provides a balance between anonymity and user recognition during discussions.')}
              </p>
            </div>
          )}

          {selectedAnonymityLevel === 'anonymous' && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h5 className="text-sm font-medium text-gray-700 mb-1">
                {safeT('connection.anonymous_info', 'Fully Anonymous Details')}
              </h5>
              <p className="text-xs text-gray-600 mb-2">
                {safeT('connection.anonymous_info_desc', 'Participants will provide minimal information to generate a unique identifier:')}
              </p>
              <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                <li>{safeT('connection.anonymous_info_part1', 'First letter of their family name (e.g., "C" from "Cormier")')}</li>
                <li>{safeT('connection.anonymous_info_part2', 'Second letter of their first name (e.g., "l" from "Alexandre")')}</li>
                <li>{safeT('connection.anonymous_info_part3', 'Date of birth (day/month)')}</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                {safeT('connection.anonymous_info_example', 'Example: For "Alexandre Cormier" born on December 16, the code would be "Cl-16/12"')}</p>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                {safeT('connection.anonymous_info_privacy', 'This ensures complete anonymity in our database. We cannot trace who used which ID, but can delete data if requested.')}
              </p>
            </div>
          )}
        </fieldset>
      </div>

      {/* Colors option toggle */}
      <div className="mb-6">
        <div className="flex items-center">
          <input
            id="enableColors"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            checked={enableColors}
            onChange={(e) => handleChange('enableColors', e.target.checked)}
          />
          <label htmlFor="enableColors" className="ml-2 block text-sm text-gray-700">
            {safeT('connection.enable_colors', 'Enable colored backgrounds for user profiles')}
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500 ml-6">
          {safeT('connection.enable_colors_desc', 'If disabled, all user profile backgrounds will be black')}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center">
          <input
            id="approvalRequired"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            checked={config.approvalRequired || false}
            onChange={(e) => handleChange('approvalRequired', e.target.checked)}
          />
          <label htmlFor="approvalRequired" className="ml-2 block text-sm text-gray-700">
            {safeT('connection.approval_required', 'Require approval to join the session')}
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500 ml-6">
          {safeT('connection.approval_required_desc', 'If enabled, you\'ll need to manually approve each participant before they can join')}
        </p>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {safeT('connection.best_practices', 'Best Practices')}
        </h4>
        <ul className="ml-5 text-xs text-blue-700 list-disc space-y-1">
          <li>{safeT('connection.best_practice_1', 'Choose "Real Identity" for classroom settings where trust is established')}</li>
          <li>{safeT('connection.best_practice_2', 'Use "Semi-Anonymous" for balanced discussions')}</li>
          <li>{safeT('connection.best_practice_3', '"Fully Anonymous" works best for sensitive topics or when privacy is critical')}</li>
        </ul>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          {safeT('connection.access_info', 'Session Access')}
        </h4>
        <p className="text-xs text-gray-600">
          {safeT('connection.access_desc', 'Participants will be able to join the session using a session link or by scanning the QR code that will be available when the session starts.')}
        </p>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {safeT('connection.images_note', 'Note on Additional Images')}
        </h4>
        <p className="text-xs text-yellow-700 mb-2">
          {safeT('connection.images_note_desc', 'Other session images such as institution logos and program images can be uploaded in the session details step.')}
        </p>
      </div>
    </div>
  );
};

export default ConnectionSettings; 