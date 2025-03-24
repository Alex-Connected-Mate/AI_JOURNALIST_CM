const { useState, useEffect } = require('react');
const Image = require('next/image');
const VoteSettings = require('./VoteSettings');

// Options de démonstration
const demoImages = [
  { value: 'university', label: 'Université', path: '/images/university.jpg' },
  { value: 'classroom', label: 'Salle de classe', path: '/images/classroom.jpg' },
  { value: 'lecture', label: 'Amphithéâtre', path: '/images/lecture.jpg' },
  { value: 'none', label: 'Aucune image', path: '' },
];

const demoEmojis = ['🎓', '📚', '💡', '✏️', '🔬', '📝', '🧠', '🤔', '👨‍🏫', '👩‍🏫'];
const demoColors = ['#3490dc', '#38c172', '#e3342f', '#f6993f', '#9561e2', '#f66d9b'];

// Options de démonstration pour les images
const IMAGE_OPTIONS = [
  { id: 'logo', label: 'Logo de l\'entreprise', src: '/logo.png' },
  { id: 'school', label: 'Image d\'école', src: '/school.png' },
  { id: 'professor', label: 'Photo du professeur', src: '/professor.png' },
  { id: 'client', label: 'Image client', src: '/client.png' },
];

// Options pour les emoji
const EMOJI_OPTIONS = ['😊', '🚀', '💡', '🎓', '📚', '🔬', '💻', '🌟', '🎯', '🧠'];

// Options pour les couleurs
const COLOR_OPTIONS = [
  { id: 'blue', value: '#3B82F6', label: 'Bleu' },
  { id: 'red', value: '#EF4444', label: 'Rouge' },
  { id: 'green', value: '#10B981', label: 'Vert' },
  { id: 'purple', value: '#8B5CF6', label: 'Violet' },
  { id: 'yellow', value: '#F59E0B', label: 'Jaune' },
  { id: 'pink', value: '#EC4899', label: 'Rose' },
  { id: 'indigo', value: '#6366F1', label: 'Indigo' },
  { id: 'teal', value: '#14B8A6', label: 'Turquoise' },
  { id: 'orange', value: '#F97316', label: 'Orange' },
  { id: 'gray', value: '#6B7280', label: 'Gris' },
];

module.exports = function SessionForm({ onChange }) {
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    professorName: '',
    showProfessorName: true,
    image: IMAGE_OPTIONS[0].id,
    profileMode: 'semi-anonymous',
    color: COLOR_OPTIONS[0].value,
    emoji: EMOJI_OPTIONS[0],
    maxParticipants: 30,
    voteSettings: {
      max_votes_per_participant: 3,
      require_reason: false,
      voting_duration: 1200,
      top_voted_count: 3
    }
  });

  // Se déclenche lorsque le formulaire change
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({
      ...prev,
      emoji
    }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
  };

  const handleVoteSettingsChange = (settings) => {
    setFormData(prev => ({
      ...prev,
      voteSettings: settings
    }));
  };

  return (
    <div className="first-level-block p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4 font-bricolage">Configuration de la session</h2>
      
      {/* Informations de base */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations générales</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la session *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="cm-input"
            placeholder="Ex: Introduction à l'intelligence artificielle"
            required
          />
        </div>
        
        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
            Institution / Programme
          </label>
          <input
            type="text"
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className="cm-input"
            placeholder="Ex: Université Paris-Saclay"
          />
        </div>
        
        <div className="space-y-2">
          <div>
            <label htmlFor="professorName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du professeur
            </label>
            <input
              type="text"
              id="professorName"
              name="professorName"
              value={formData.professorName}
              onChange={handleChange}
              className="cm-input"
              placeholder="Ex: Dr. Jean Dupont"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showProfessorName"
              name="showProfessorName"
              checked={formData.showProfessorName}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showProfessorName" className="ml-2 block text-sm text-gray-700">
              Afficher le nom du professeur publiquement
            </label>
          </div>
        </div>
      </div>
      
      {/* Sélection d'image */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Image</h3>
        
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez une image
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {IMAGE_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className={`relative border p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${formData.image === option.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                onClick={() => setFormData(prev => ({ ...prev, image: option.id }))}
              >
                <div className="aspect-square relative">
                  <div className="flex items-center justify-center h-full">
                    <Image
                      src={option.src}
                      alt={option.label}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                </div>
                <p className="text-xs text-center mt-2">{option.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Configuration du profil utilisateur */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Profil des participants</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode de profil</label>
          
          <div className="space-y-2">
            <div className="relative second-level-block p-4 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, profileMode: 'anonymous' }))}>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="anonymousMode"
                  name="profileMode"
                  value="anonymous"
                  checked={formData.profileMode === 'anonymous'}
                  onChange={handleChange}
                  className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label htmlFor="anonymousMode" className="font-medium">Anonyme</label>
                  <p className="text-sm text-gray-500">
                    Génère automatiquement un identifiant pour chaque participant (ex: AB12345)
                  </p>
                </div>
              </div>
              {formData.profileMode === 'anonymous' && (
                <div className="mt-3 ml-7 text-sm text-gray-600">
                  <p className="italic">Format: 2 premières lettres du nom + date secrète</p>
                  <p className="mt-2">Exemple: Pour "Alexandre Cormeret", généré: AC16122001</p>
                </div>
              )}
            </div>
            
            <div className="relative second-level-block p-4 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, profileMode: 'semi-anonymous' }))}>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="semiAnonymousMode"
                  name="profileMode"
                  value="semi-anonymous"
                  checked={formData.profileMode === 'semi-anonymous'}
                  onChange={handleChange}
                  className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label htmlFor="semiAnonymousMode" className="font-medium">Semi-anonyme</label>
                  <p className="text-sm text-gray-500">
                    Permet d'utiliser un pseudonyme, sélectionner un emoji et ajouter une photo optionnelle
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative second-level-block p-4 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, profileMode: 'non-anonymous' }))}>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="nonAnonymousMode"
                  name="profileMode"
                  value="non-anonymous"
                  checked={formData.profileMode === 'non-anonymous'}
                  onChange={handleChange}
                  className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label htmlFor="nonAnonymousMode" className="font-medium">Non-anonyme</label>
                  <p className="text-sm text-gray-500">
                    Utilise les informations complètes (nom, téléphone, email, liens supplémentaires)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Personnalisation additionnelle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personnalisation</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du profil</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(color => (
              <div
                key={color.id}
                className={`w-8 h-8 rounded-full cursor-pointer hover:opacity-90 transition-opacity ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
                title={color.label}
              />
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emoji du profil</label>
          <div className="flex flex-wrap gap-3">
            {EMOJI_OPTIONS.map(emoji => (
              <div
                key={emoji}
                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${formData.emoji === emoji ? 'bg-gray-200' : ''}`}
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre maximum de participants
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            min={1}
            max={500}
            className="cm-input"
          />
        </div>
      </div>
      
      {/* Configuration des votes */}
      <VoteSettings 
        initialSettings={formData.voteSettings} 
        onChange={handleVoteSettingsChange} 
      />
    </div>
  );
} 