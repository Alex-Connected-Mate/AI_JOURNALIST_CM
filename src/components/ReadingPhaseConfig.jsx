import React from 'react';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';

/**
 * ReadingPhaseConfig Component
 * 
 * Configuration for the reading phase where AI-generated "books" of insights
 * are displayed to participants based on the conversations with the AI journalist.
 */
const ReadingPhaseConfig = ({ sessionConfig, updateSessionConfig }) => {
  const {
    enableReadingPhase = true,
    displayBooksImmediately = false,
    bookAnimationDuration = 3, // seconds
    blurOtherContentDuringReading = true,
    readingPhaseAutoProgress = true,
    readingPhaseAutoProgressTime = 60, // seconds
    bookStyle = 'modern',
  } = sessionConfig;

  const handleChange = (field, value) => {
    updateSessionConfig({
      ...sessionConfig,
      [field]: value
    });
  };

  const bookStyles = [
    { value: 'modern', label: 'Moderne', description: 'Design épuré avec animations douces' },
    { value: 'classic', label: 'Classique', description: 'Apparence de livre traditionnel avec pages' },
    { value: 'digital', label: 'Digital', description: 'Style tablette avec effets technologiques' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
        <p className="text-indigo-700">
          Configurez comment les livres d'insights générés par l'IA seront présentés aux participants
          après les conversations avec l'IA Journaliste.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Paramètres d'Affichage</h3>
          
          <div className="space-y-2">
            <Checkbox
              label="Activer la phase de lecture"
              checked={enableReadingPhase}
              onChange={(value) => handleChange('enableReadingPhase', value)}
            />
            <p className="text-sm text-gray-500 ml-6">
              Si désactivé, les livres seront disponibles mais la phase de lecture sera ignorée.
            </p>
          </div>

          <div className={enableReadingPhase ? "" : "opacity-50 pointer-events-none"}>
            <div className="space-y-2 mt-4">
              <Checkbox
                label="Afficher les livres immédiatement après génération"
                checked={displayBooksImmediately}
                onChange={(value) => handleChange('displayBooksImmediately', value)}
                disabled={!enableReadingPhase}
              />
              <p className="text-sm text-gray-500 ml-6">
                Si activé, les livres apparaîtront dès qu'ils sont générés. Sinon, ils apparaîtront tous en même temps.
              </p>
            </div>
            
            <div className="mt-4">
              <NumberInput
                label="Durée de l'animation d'apparition (secondes)"
                value={bookAnimationDuration}
                onChange={(value) => handleChange('bookAnimationDuration', value)}
                min={1}
                max={10}
                step={0.5}
                disabled={!enableReadingPhase}
              />
              <p className="text-sm text-gray-500 mt-1">
                Durée de l'animation quand un nouveau livre apparaît sur l'écran des participants.
              </p>
            </div>
            
            <div className="space-y-2 mt-4">
              <Checkbox
                label="Flouter le reste du contenu pendant la lecture"
                checked={blurOtherContentDuringReading}
                onChange={(value) => handleChange('blurOtherContentDuringReading', value)}
                disabled={!enableReadingPhase}
              />
              <p className="text-sm text-gray-500 ml-6">
                Lorsqu'un participant lit un livre, le reste de l'interface sera légèrement flouté pour favoriser la concentration.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-4">Style des Livres</h4>
            
            <div className="space-y-3">
              {bookStyles.map((style) => (
                <div key={style.value} className="flex items-start">
                  <input
                    type="radio"
                    id={`style-${style.value}`}
                    name="bookStyle"
                    value={style.value}
                    checked={bookStyle === style.value}
                    onChange={() => handleChange('bookStyle', style.value)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    disabled={!enableReadingPhase}
                  />
                  <label htmlFor={`style-${style.value}`} className="ml-3">
                    <span className="block text-sm font-medium text-gray-700">{style.label}</span>
                    <span className="block text-xs text-gray-500">{style.description}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Progression et Transition</h3>
          
          <div className="space-y-2">
            <Checkbox
              label="Progression automatique après lecture"
              checked={readingPhaseAutoProgress}
              onChange={(value) => handleChange('readingPhaseAutoProgress', value)}
              disabled={!enableReadingPhase}
            />
            <p className="text-sm text-gray-500 ml-6">
              Si activé, les participants seront automatiquement redirigés vers la phase suivante après un temps défini.
            </p>
          </div>
          
          <div className={readingPhaseAutoProgress && enableReadingPhase ? "" : "opacity-50 pointer-events-none"}>
            <div className="mt-4">
              <NumberInput
                label="Temps de lecture minimum (secondes)"
                value={readingPhaseAutoProgressTime}
                onChange={(value) => handleChange('readingPhaseAutoProgressTime', value)}
                min={30}
                max={300}
                step={10}
                disabled={!readingPhaseAutoProgress || !enableReadingPhase}
              />
              <p className="text-sm text-gray-500 mt-1">
                Temps minimum accordé aux participants pour lire les livres avant la progression automatique.
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-gray-200 mt-6">
            <h4 className="font-semibold mb-3">Aperçu de l'Interface de Lecture</h4>
            
            <div className="relative mt-4">
              <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">Livres d'Insights</h5>
                  <span className="text-xs text-gray-500">3 livres générés</span>
                </div>
                
                <div className="flex space-x-4 overflow-x-auto py-2">
                  <div className={`rounded-md shadow-md overflow-hidden w-32 h-44 flex-shrink-0 ${bookStyle === 'modern' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : bookStyle === 'classic' ? 'bg-amber-100 border-2 border-amber-700' : 'bg-gray-800'}`}>
                    <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-2xl">📕</span>
                      <span className={`text-xs font-medium mt-2 ${bookStyle === 'digital' ? 'text-white' : bookStyle === 'modern' ? 'text-white' : 'text-amber-900'}`}>Histoire de Marie</span>
                      <span className={`text-xs mt-1 ${bookStyle === 'digital' ? 'text-gray-300' : bookStyle === 'modern' ? 'text-blue-100' : 'text-amber-800'}`}>Voyage & Découverte</span>
                    </div>
                  </div>
                  
                  <div className={`rounded-md shadow-md overflow-hidden w-32 h-44 flex-shrink-0 ${bookStyle === 'modern' ? 'bg-gradient-to-br from-green-500 to-teal-600' : bookStyle === 'classic' ? 'bg-amber-100 border-2 border-amber-700' : 'bg-gray-800'}`}>
                    <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-2xl">📗</span>
                      <span className={`text-xs font-medium mt-2 ${bookStyle === 'digital' ? 'text-white' : bookStyle === 'modern' ? 'text-white' : 'text-amber-900'}`}>Expérience de Thomas</span>
                      <span className={`text-xs mt-1 ${bookStyle === 'digital' ? 'text-gray-300' : bookStyle === 'modern' ? 'text-blue-100' : 'text-amber-800'}`}>Innovation & Créativité</span>
                    </div>
                  </div>
                  
                  <div className={`rounded-md shadow-md overflow-hidden w-32 h-44 flex-shrink-0 ${bookStyle === 'modern' ? 'bg-gradient-to-br from-red-500 to-pink-600' : bookStyle === 'classic' ? 'bg-amber-100 border-2 border-amber-700' : 'bg-gray-800'}`}>
                    <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-2xl">📘</span>
                      <span className={`text-xs font-medium mt-2 ${bookStyle === 'digital' ? 'text-white' : bookStyle === 'modern' ? 'text-white' : 'text-amber-900'}`}>Récit de Sophie</span>
                      <span className={`text-xs mt-1 ${bookStyle === 'digital' ? 'text-gray-300' : bookStyle === 'modern' ? 'text-pink-100' : 'text-amber-800'}`}>Défis & Résilience</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {!enableReadingPhase && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
                  <p className="text-sm text-gray-500 font-medium">Phase de lecture désactivée</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
            <h4 className="font-medium text-yellow-800 mb-2">📚 Livres d'Insights</h4>
            <p className="text-sm text-yellow-700">
              Les livres d'insights sont générés à partir des conversations avec l'IA Journaliste. Ils résument les 
              points clés, les histoires partagées, et mettent en évidence les thèmes communs entre différentes discussions.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Ils serviront de base pour la phase finale d'analyse, permettant au professeur de présenter les résultats clés de la session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingPhaseConfig; 