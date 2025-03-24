const { useMemo } = require('react');
const Image = require('next/image');

// Fonction pour générer un identifiant anonyme de manière stable
const generateAnonymousId = (professorName) => {
  if (!professorName || professorName.length < 2) return "XX12345";
  
  const initials = professorName.substring(0, 2).toUpperCase();
  
  // Create a stable hash based on the professor's name
  const nameHash = professorName.split('').reduce((acc, char, index) => 
    acc + char.charCodeAt(0) * (index + 1), 0) % 100000;
  
  // Format to ensure it's always 5 digits
  const formattedHash = nameHash.toString().padStart(5, '0');
  
  return `${initials}${formattedHash}`;
};

const SessionPreview = ({ session = {} }) => {
  const {
    name = "Ma Session Interactive",
    institution = "Mon Université",
    professorName = "Prof. Exemple",
    showProfessorName = true,
    image = "university",
    profileMode = "anonymous",
    color = "#3490dc",
    emoji = "🎓",
    maxParticipants = 50,
  } = session;

  const imagePath = useMemo(() => {
    if (!image || image === 'none') return null;
    return `/images/${image}.jpg`;
  }, [image]);
  
  const anonymousId = useMemo(() => generateAnonymousId(professorName), [professorName]);

  const renderProfilePreview = () => {
    const styles = {
      container: `rounded-lg p-4 mb-6 border border-gray-200 shadow-sm`,
      label: `text-sm font-medium text-gray-500 mb-2`,
      value: `text-base font-semibold`
    };

    return (
      <div className={styles.container}>
        <h3 className="text-lg font-bold mb-4">Configuration des profils</h3>
        
        <div className="mb-4">
          <div className={styles.label}>Mode de profil</div>
          <div className={styles.value}>{
            profileMode === 'anonymous' ? 'Anonyme' : 
            profileMode === 'semi-anonymous' ? 'Semi-anonyme' : 
            'Non-anonyme'
          }</div>
        </div>
        
        <div className="mb-4">
          <div className={styles.label}>Exemple d'affichage</div>
          <div className="flex items-center mt-2 p-2 bg-gray-50 rounded">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3" 
              style={{ backgroundColor: color }}
            >
              {emoji}
            </div>
            
            <div>
              {profileMode === 'anonymous' && (
                <div className="font-medium">Utilisateur {anonymousId}</div>
              )}
              
              {profileMode === 'semi-anonymous' && (
                <>
                  <div className="font-medium">Utilisateur {anonymousId}</div>
                  <div className="text-xs text-gray-500">{institution}</div>
                </>
              )}
              
              {profileMode === 'non-anonymous' && (
                <>
                  <div className="font-medium">{professorName}</div>
                  <div className="text-xs text-gray-500">{institution}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="relative h-40 bg-gray-200">
        {imagePath ? (
          <div className="absolute inset-0">
            <img
              src={imagePath}
              alt={name}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <span className="text-4xl">{emoji}</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
          <h2 className="text-white text-xl font-bold truncate">{name}</h2>
          <p className="text-white text-sm opacity-90">{institution}</p>
          {showProfessorName && (
            <p className="text-white text-sm opacity-80">Par {professorName}</p>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {renderProfilePreview()}
        
        <div className="rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Informations de session</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Couleur</div>
              <div className="flex items-center mt-1">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                <span className="text-sm">{color}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Emoji</div>
              <div className="text-sm mt-1">{emoji}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Max. participants</div>
              <div className="text-sm mt-1">{maxParticipants}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Participants connectés</span>
            <span>0 / {maxParticipants}</span>
          </div>
          <div className="mt-2 px-4 py-6 bg-gray-50 rounded-lg text-center text-gray-400">
            Aucun participant pour l'instant
          </div>
        </div>
      </div>
    </div>
  );
};

module.exports = SessionPreview; 