import React from 'react';
import RadioGroup from './RadioGroup';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';
import { QRCodeSVG } from 'qrcode.react';

/**
 * ConnectionPhaseConfig Component
 * 
 * Configuration for the participant connection phase:
 * - Participant profile mode (anonymous, semi-anonymous, non-anonymous)
 * - Connection method options
 * - Maximum participants
 * - QR code / URL preview for joining
 */
const ConnectionPhaseConfig = ({ sessionConfig, updateSessionConfig }) => {
  const {
    profileMode = 'anonymous',
    requireApproval = false,
    sessionId = 'preview-session',
    maxParticipants = 30,
    anonymousMethod = 'random-id',
  } = sessionConfig;

  const handleChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      [field]: value
    });
  };

  const userModeOptions = [
    {
      value: 'real-identity',
      label: 'Identité Réelle',
      description: 'Nom, prénom, image de profil et un lien personnel (LinkedIn, WhatsApp, Instagram, site web...)'
    },
    {
      value: 'semi-anonymous',
      label: 'Semi-Anonyme',
      description: 'Sans image, mais avec une couleur, un emoji et un pseudonyme'
    },
    {
      value: 'anonymous',
      label: 'Totalement Anonyme',
      description: 'Identification via une méthode anonyme au choix'
    }
  ];

  const anonymousMethodOptions = [
    {
      value: 'random-id',
      label: 'ID Aléatoire',
      description: 'Ex: #56301 - Un identifiant aléatoire attribué automatiquement'
    },
    {
      value: 'initials-dob',
      label: 'Initiales + Date de Naissance',
      description: 'Ex: A.C. 16/12/2001 - Première lettre du prénom et nom + date de naissance'
    }
  ];

  // Simulated session join URL with production domain
  const joinUrl = `https://ai-journalist-connectedmate.vercel.app/join/${sessionId}`;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700">
          Configurez comment les participants se connecteront à votre session et 
          quelles informations seront demandées.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Profil des Participants</h3>
          
          <RadioGroup
            label="Mode de Profil"
            name="profileMode"
            options={userModeOptions}
            value={profileMode}
            onChange={(value) => handleChange('profileMode', value)}
          />

          <NumberInput
            label="Nombre Maximum de Participants"
            value={maxParticipants}
            onChange={(value) => handleChange('maxParticipants', value)}
            min={5}
            max={200}
          />
          
          <div className="mt-4">
            <Checkbox
              label="Approbation requise pour rejoindre la session"
              checked={requireApproval}
              onChange={(value) => handleChange('requireApproval', value)}
            />
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Si activé, vous devrez approuver manuellement chaque participant avant qu'il puisse rejoindre la session.
            </p>
          </div>

          {profileMode === 'anonymous' && (
            <div>
              <h4 className="font-medium mb-3">Méthode d'identification anonyme</h4>
              <RadioGroup
                name="anonymousMethod"
                options={anonymousMethodOptions}
                value={anonymousMethod}
                onChange={(value) => handleChange('anonymousMethod', value)}
              />
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <h4 className="font-medium mb-2">🔒 Mode Totalement Anonyme</h4>
                <p className="text-sm text-gray-600">
                  Ce mode garantit l'anonymat complet des participants pendant toutes les phases de la session.
                </p>
                
                {anonymousMethod === 'random-id' ? (
                  <div className="mt-3 bg-white p-2 rounded border border-gray-200 inline-flex items-center">
                    <span className="text-gray-800 font-mono">#56301</span>
                    <span className="ml-2 text-xs text-gray-500">Exemple d'ID</span>
                  </div>
                ) : (
                  <div className="mt-3 bg-white p-2 rounded border border-gray-200 inline-flex items-center">
                    <span className="text-gray-800">A.C. 16/12/2001</span>
                    <span className="ml-2 text-xs text-gray-500">Exemple d'identification</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {profileMode === 'semi-anonymous' && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2">🎭 Mode Semi-Anonyme</h4>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                  <span role="img" aria-label="user emoji">🚀</span>
                </div>
                <div className="font-medium">DiscussionHero42</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Les participants pourront personnaliser:
              </p>
              <ul className="list-disc text-sm text-gray-600 ml-5 mt-1">
                <li>Un pseudonyme unique</li>
                <li>Une couleur d'identification</li>
                <li>Un emoji personnalisé</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                Leur véritable identité reste protégée tout en permettant une personnalisation.
              </p>
            </div>
          )}

          {profileMode === 'real-identity' && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2">👤 Mode Identité Réelle</h4>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-medium">Alexandre Cormeraie</div>
                  <div className="text-xs text-blue-600 underline">linkedin.com/in/alexandrecormeraie</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Les participants devront fournir:
              </p>
              <ul className="list-disc text-sm text-gray-600 ml-5 mt-1">
                <li>Nom complet</li>
                <li>Image de profil</li>
                <li>Un lien personnel (LinkedIn, Instagram, WhatsApp, site web...)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                Ce mode est recommandé pour les sessions professionnelles ou lorsque l'identité est importante.
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Connexion à la Session</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center">
            <div className="bg-white p-2 rounded border border-gray-300 mb-4">
              <QRCodeSVG value={joinUrl} size={180} level="H" />
            </div>
            
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">Les participants peuvent rejoindre via ce QR code ou l'URL:</p>
              <p className="text-blue-600 font-medium mt-1 select-all">
                {joinUrl}
              </p>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Ce QR code et l'URL seront générés automatiquement une fois la session créée.
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-medium text-yellow-800 mb-2">📌 Bonnes Pratiques</h4>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• <strong>Identité réelle</strong>: Idéal pour les cours où les participants se connaissent déjà</li>
              <li>• <strong>Semi-anonyme</strong>: Parfait pour favoriser l'expression libre tout en gardant une personnalisation</li>
              <li>• <strong>Anonyme</strong>: Optimal pour les discussions sensibles ou pour éviter les biais sociaux</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPhaseConfig; 