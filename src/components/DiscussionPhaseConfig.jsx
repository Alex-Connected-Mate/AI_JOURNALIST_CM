const React = require('react');
const NumberInput = require('./NumberInput');
const Input = require('./Input');
const Checkbox = require('./Checkbox');

/**
 * DiscussionPhaseConfig Component
 * 
 * Configuration for the discussion and voting phase:
 * - Timer duration
 * - Custom message to display
 * - Maximum votes ("likes") per participant
 * - Vote/like visibility options
 */
const DiscussionPhaseConfig = ({ sessionConfig, updateSessionConfig }) => {
  const {
    discussionDuration = 1200, // 20 minutes in seconds by default
    discussionMessage = "Discutez entre vous et votez pour les participants avec les meilleures histoires.",
    maxVotesPerParticipant = 3,
    showVotesRealTime = true,
    requireVoteReason = false,
    discussionGoal = "Partagez vos expériences et votez pour les histoires les plus inspirantes",
  } = sessionConfig;

  const handleChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      [field]: value
    });
  };

  // Convert seconds to minutes for the UI
  const durationInMinutes = Math.floor(discussionDuration / 60);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700">
          Configurez la phase de discussion et les votes. Pendant cette phase, les participants
          pourront échanger et "liker" les histoires les plus intéressantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Configuration du Timer</h3>
          
          <NumberInput
            label="Durée de la Discussion (minutes)"
            value={durationInMinutes}
            onChange={(value) => handleChange('discussionDuration', value * 60)}
            min={1}
            max={60}
          />
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center">
            <div className="w-16 h-16 bg-white rounded-full border-4 border-blue-500 flex items-center justify-center mr-4 text-lg font-bold">
              {durationInMinutes}:00
            </div>
            <div>
              <h4 className="font-medium">Minuteur de Session</h4>
              <p className="text-sm text-gray-600">
                Le minuteur sera visible pour tous les participants et décomptera automatiquement.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Objectif de la Discussion
            </label>
            <textarea
              value={discussionGoal}
              onChange={(e) => handleChange('discussionGoal', e.target.value)}
              className="input w-full h-24"
              placeholder="Expliquez clairement l'objectif de cette phase aux participants..."
            />
            <p className="text-sm text-gray-500">
              Cet objectif sera affiché de manière proéminente pour guider les échanges.
            </p>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Message Complémentaire (optionnel)
            </label>
            <textarea
              value={discussionMessage}
              onChange={(e) => handleChange('discussionMessage', e.target.value)}
              className="input w-full h-24"
              placeholder="Instructions additionnelles pour les participants..."
            />
            <p className="text-sm text-gray-500">
              Ce message secondaire sera affiché aux participants pendant la phase de discussion.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Configuration des Votes</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold mb-4">Système de "Likes"</h4>
            <p className="text-sm text-gray-600 mb-4">
              Les participants pourront "liker" les personnes dont les histoires sont les plus intéressantes.
              Les plus "likés" seront automatiquement dirigés vers l'IA Journaliste.
            </p>
            
            <div className="flex items-center justify-center space-x-4 my-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <span role="img" aria-label="user">👤</span>
                </div>
                <div className="text-xs text-gray-500">Participant</div>
              </div>
              <div className="flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 3L4.5 12L13.5 21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 12H21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <span role="img" aria-label="heart">❤️</span>
                </div>
                <div className="text-xs text-gray-500">Like</div>
              </div>
              <div className="flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 3L4.5 12L13.5 21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 12H21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                  <span role="img" aria-label="robot">🤖</span>
                </div>
                <div className="text-xs text-gray-500">IA Journaliste</div>
              </div>
            </div>
          </div>
          
          <NumberInput
            label="Nombre Maximum de Likes par Participant"
            value={maxVotesPerParticipant}
            onChange={(value) => handleChange('maxVotesPerParticipant', value)}
            min={1}
            max={100}
          />
          
          <div className="space-y-2">
            <Checkbox
              label="Afficher les likes en temps réel"
              checked={showVotesRealTime}
              onChange={(value) => handleChange('showVotesRealTime', value)}
            />
            <p className="text-sm text-gray-500 ml-6">
              Si activé, les participants verront le nombre de likes reçus en temps réel.
            </p>
          </div>
          
          <div className="space-y-2">
            <Checkbox
              label="Exiger une raison pour chaque like"
              checked={requireVoteReason}
              onChange={(value) => handleChange('requireVoteReason', value)}
            />
            <p className="text-sm text-gray-500 ml-6">
              Si activé, les participants devront justifier chacun de leurs likes.
            </p>
          </div>
          
          <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-white">
            <h4 className="font-semibold mb-3">Sélection des Participants pour l'IA</h4>
            <p className="text-sm text-gray-600">
              À la fin de la phase de vote, les participants ayant reçu le plus de likes seront 
              automatiquement sélectionnés pour la phase d'interaction avec l'IA Journaliste.
            </p>
            <div className="mt-3 flex items-center">
              <span className="text-sm text-gray-700 mr-2">Nombre approximatif de sélectionnés:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                {Math.max(3, Math.ceil(maxVotesPerParticipant / 2))}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Ce nombre est calculé automatiquement en fonction du nombre de likes par participant.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-medium text-yellow-800 mb-2">📌 Conseil</h4>
            <p className="text-sm text-yellow-700">
              Pour une session de 30 participants, nous recommandons une durée de 15-20 minutes et 
              une limite de 3 likes par personne. Cela permet des échanges significatifs tout en 
              maintenant un rythme dynamique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

module.exports = DiscussionPhaseConfig; 