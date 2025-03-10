/**
 * Composant d'affichage des résultats d'analyse
 * 
 * Ce composant affiche les résultats des analyses dans un format lisible et organisé,
 * avec des onglets pour naviguer entre les différentes analyses (nuggets, lightbulbs, overall).
 */

import React, { useState, useEffect } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel, classNames } from '@/components/Tabs';
import { motion } from 'framer-motion';
import { ANALYSIS_TYPES } from '@/lib/services/analysisService';
import logger from '@/lib/logger';

/**
 * Card générique pour afficher les informations d'analyse
 */
function AnalysisCard({ title, children, highlighted = false }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-4 ${highlighted ? 'border-2 border-blue-500' : ''}`}>
      {title && <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
}

/**
 * Affichage des insights du type Nuggets
 */
function NuggetsInsights({ data }) {
  if (!data || !data.insights || data.insights.length === 0) {
    return (
      <AnalysisCard>
        <p className="text-gray-500 italic">Aucun insight disponible.</p>
      </AnalysisCard>
    );
  }

  return (
    <>
      {data.insights.map((insight, index) => (
        <AnalysisCard key={index} title={insight.title}>
          <p className="mb-4 text-gray-700">{insight.description}</p>
          
          {insight.keyPoints && insight.keyPoints.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Points clés:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {insight.keyPoints.map((point, i) => (
                  <li key={i} className="text-gray-600">{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          {insight.relevantQuotes && insight.relevantQuotes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Citations pertinentes:</h4>
              {insight.relevantQuotes.map((quote, i) => (
                <blockquote key={i} className="border-l-4 border-blue-200 pl-4 py-2 mb-2 text-gray-600 italic">
                  "{quote.text}"
                  {quote.context && <p className="text-xs text-gray-500 mt-1">Contexte: {quote.context}</p>}
                </blockquote>
              ))}
            </div>
          )}
        </AnalysisCard>
      ))}
      
      {data.patternDiscovered && (
        <AnalysisCard title="Modèle découvert" highlighted>
          <p className="font-medium text-gray-800 mb-2">{data.patternDiscovered.pattern}</p>
          <p className="mb-2 text-gray-700">{data.patternDiscovered.evidence}</p>
          <p className="text-gray-600 italic">{data.patternDiscovered.significance}</p>
        </AnalysisCard>
      )}
    </>
  );
}

/**
 * Affichage des insights du type Lightbulbs
 */
function LightbulbsInsights({ data }) {
  if (!data || (!data.innovativeIdeas || data.innovativeIdeas.length === 0)) {
    return (
      <AnalysisCard>
        <p className="text-gray-500 italic">Aucune idée innovante disponible.</p>
      </AnalysisCard>
    );
  }

  return (
    <>
      {data.innovativeIdeas && data.innovativeIdeas.map((idea, index) => (
        <AnalysisCard key={index} title={idea.title} highlighted>
          <p className="mb-4 text-gray-700">{idea.description}</p>
          
          {idea.potentialApplications && idea.potentialApplications.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Applications potentielles:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {idea.potentialApplications.map((app, i) => (
                  <li key={i} className="text-gray-600">{app}</li>
                ))}
              </ul>
            </div>
          )}
        </AnalysisCard>
      ))}
      
      {data.crossConnections && data.crossConnections.length > 0 && (
        <AnalysisCard title="Connexions interdisciplinaires">
          {data.crossConnections.map((connection, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex space-x-2 mb-2">
                {connection.domains.map((domain, i) => (
                  <span key={i} className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                    {domain}
                  </span>
                ))}
              </div>
              <p className="text-gray-700 mb-1">{connection.insight}</p>
              <p className="text-gray-600 italic text-sm">{connection.value}</p>
            </div>
          ))}
        </AnalysisCard>
      )}
      
      {data.evaluationScore && (
        <AnalysisCard title="Évaluation">
          <div className="flex items-center mb-4">
            <div className="text-2xl font-bold text-blue-600 mr-3">{data.evaluationScore}/5</div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${i < data.evaluationScore ? 'text-yellow-400' : 'text-gray-300'}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          
          {data.developmentSuggestions && data.developmentSuggestions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Suggestions de développement:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {data.developmentSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-gray-600">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </AnalysisCard>
      )}
    </>
  );
}

/**
 * Affichage de l'analyse globale
 */
function OverallAnalysis({ data }) {
  if (!data || !data.sessionOverview) {
    return (
      <AnalysisCard>
        <p className="text-gray-500 italic">Aucune analyse globale disponible.</p>
      </AnalysisCard>
    );
  }

  return (
    <>
      {/* Vue d'ensemble de la session */}
      <AnalysisCard title="Vue d'ensemble">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Discussions totales</div>
            <div className="text-xl font-bold text-gray-800">{data.sessionOverview.totalDiscussions}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Discussions analysées</div>
            <div className="text-xl font-bold text-gray-800">{data.sessionOverview.analyzedDiscussions}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Niveau de participation</div>
            <div className="text-xl font-bold text-gray-800">{data.sessionOverview.participationLevel}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Qualité globale</div>
            <div className="text-xl font-bold text-gray-800">{data.sessionOverview.overallQuality}</div>
          </div>
        </div>
      </AnalysisCard>
      
      {/* Synthèse des thèmes principaux */}
      {data.keySynthesis && data.keySynthesis.mainThemes && data.keySynthesis.mainThemes.length > 0 && (
        <AnalysisCard title="Thèmes principaux">
          {data.keySynthesis.mainThemes.map((theme, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">{theme.title}</h4>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  theme.significance === 'Haute' ? 'bg-green-100 text-green-700' :
                  theme.significance === 'Moyenne' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {theme.significance}
                </span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${theme.frequency}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm text-gray-600">{theme.frequency}%</span>
              </div>
              <p className="text-sm text-gray-600">
                Insights connexes: {theme.relatedInsights}
              </p>
            </div>
          ))}
        </AnalysisCard>
      )}
      
      {/* Innovation hotspots */}
      {data.keySynthesis && data.keySynthesis.innovationHotspots && data.keySynthesis.innovationHotspots.length > 0 && (
        <AnalysisCard title="Zones d'innovation">
          {data.keySynthesis.innovationHotspots.map((hotspot, index) => (
            <div key={index} className="mb-4 border-b border-gray-100 pb-4 last:mb-0 last:border-0 last:pb-0">
              <h4 className="font-medium text-gray-800 mb-2">{hotspot.area}</h4>
              <div className="flex space-x-4 text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{hotspot.participants}</span> participants
                </div>
                <div className="text-gray-600">
                  Impact potentiel: <span className="font-medium">{hotspot.potentialImpact}</span>
                </div>
              </div>
            </div>
          ))}
        </AnalysisCard>
      )}
      
      {/* Recommandations */}
      {data.actionableRecommendations && data.actionableRecommendations.length > 0 && (
        <AnalysisCard title="Recommandations" highlighted>
          {data.actionableRecommendations.map((recommendation, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <h4 className="font-bold text-gray-800 mb-2">{recommendation.title}</h4>
              <p className="mb-3 text-gray-700">{recommendation.description}</p>
              
              {recommendation.implementationSteps && recommendation.implementationSteps.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Étapes de mise en œuvre:</h5>
                  <ol className="list-decimal pl-5 space-y-1">
                    {recommendation.implementationSteps.map((step, i) => (
                      <li key={i} className="text-gray-600">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {recommendation.expectedOutcomes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-700 mb-1">Résultats attendus:</h5>
                  <p className="text-blue-600">{recommendation.expectedOutcomes}</p>
                </div>
              )}
            </div>
          ))}
        </AnalysisCard>
      )}
      
      {/* Résumé et conclusion */}
      {data.sessionSummary && (
        <AnalysisCard title="Résumé et conclusion">
          {data.sessionSummary.strengths && data.sessionSummary.strengths.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Points forts:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {data.sessionSummary.strengths.map((strength, i) => (
                  <li key={i} className="text-gray-600">{strength}</li>
                ))}
              </ul>
            </div>
          )}
          
          {data.sessionSummary.opportunities && data.sessionSummary.opportunities.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Opportunités:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {data.sessionSummary.opportunities.map((opportunity, i) => (
                  <li key={i} className="text-gray-600">{opportunity}</li>
                ))}
              </ul>
            </div>
          )}
          
          {data.sessionSummary.overallConclusion && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Conclusion générale:</h4>
              <p className="text-gray-700">{data.sessionSummary.overallConclusion}</p>
            </div>
          )}
        </AnalysisCard>
      )}
    </>
  );
}

/**
 * Composant principal pour afficher les résultats d'analyse
 */
export default function AnalysisResults({ sessionId, analysisData = {} }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabCategories = [
    { name: 'Nuggets', type: ANALYSIS_TYPES.NUGGETS },
    { name: 'Lightbulbs', type: ANALYSIS_TYPES.LIGHTBULBS },
    { name: 'Analyse globale', type: ANALYSIS_TYPES.OVERALL }
  ];

  // Rendu des onglets et de leur contenu
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Résultats d'analyse</h2>
      
      <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
        <TabList className="flex space-x-1 rounded-xl bg-blue-900/10 p-1 mb-6">
          {tabCategories.map((category, index) => (
            <Tab
              key={category.type}
              index={index}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
                )
              }
            >
              {category.name}
            </Tab>
          ))}
        </TabList>
        
        <TabPanels className="mt-2">
          {tabCategories.map((category, idx) => (
            <TabPanel
              key={idx}
              index={idx}
              className={classNames(
                'rounded-xl p-3',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {category.type === ANALYSIS_TYPES.NUGGETS && (
                  <NuggetsInsights data={analysisData[ANALYSIS_TYPES.NUGGETS]} />
                )}
                
                {category.type === ANALYSIS_TYPES.LIGHTBULBS && (
                  <LightbulbsInsights data={analysisData[ANALYSIS_TYPES.LIGHTBULBS]} />
                )}
                
                {category.type === ANALYSIS_TYPES.OVERALL && (
                  <OverallAnalysis data={analysisData[ANALYSIS_TYPES.OVERALL]} />
                )}
                
                {/* Si aucune donnée n'est disponible pour ce type */}
                {!analysisData[category.type] && (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      Aucune analyse disponible
                    </h3>
                    <p className="text-gray-600">
                      Les résultats d'analyse de type "{category.name}" ne sont pas encore disponibles 
                      pour cette session.
                    </p>
                  </div>
                )}
              </motion.div>
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
} 