import React from 'react';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';

// Simplified Analysis Item component without drag & drop
const AnalysisItem = ({ item, toggleItem, moveUp, moveDown, isFirst, isLast }) => {
  const iconMap = {
    'nuggets': '💎',
    'lightbulbs': '💡',
    'overall': '📊'
  };
  
  const bgColorMap = {
    'nuggets': 'bg-indigo-100 border-indigo-300',
    'lightbulbs': 'bg-amber-100 border-amber-300',
    'overall': 'bg-emerald-100 border-emerald-300'
  };
  
  const textColorMap = {
    'nuggets': 'text-indigo-800',
    'lightbulbs': 'text-amber-800',
    'overall': 'text-emerald-800'
  };
  
  return (
    <div className={`flex items-center p-4 mb-2 rounded-lg border ${bgColorMap[item.type]}`}>
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white mr-3">
        <span className="text-xl">{iconMap[item.type]}</span>
      </div>
      <div className="flex-grow">
        <h4 className={`font-medium ${textColorMap[item.type]}`}>{item.title}</h4>
        <p className="text-sm text-gray-600">
          {item.type === 'nuggets' && 'Analysis of Nuggets conversations'}
          {item.type === 'lightbulbs' && 'Analysis of Lightbulbs conversations'}
          {item.type === 'overall' && 'Combined analysis of all conversations'}
        </p>
      </div>
      <div className="flex items-center">
        <div className="flex flex-col mr-4">
          <button 
            onClick={() => moveUp(item.id)} 
            disabled={isFirst}
            className={`p-1 mb-1 ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
            aria-label="Move up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => moveDown(item.id)} 
            disabled={isLast}
            className={`p-1 ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
            aria-label="Move down"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <Checkbox
          checked={item.enabled}
          onChange={() => toggleItem(item.id)}
        />
      </div>
    </div>
  );
};

const FinalAnalysisConfig = ({ 
  analysisItems, 
  setAnalysisItems, 
  analysisConfiguration, 
  updateSessionConfig,
  sessionConfig,
  CollapsibleSection,
  isOpen,
  onToggle,
  color = "indigo",
  moveItemUp,
  moveItemDown,
  toggleAnalysisItem
}) => {
  return (
    <CollapsibleSection 
      title="Final Analysis Configuration" 
      isOpen={isOpen}
      onToggle={onToggle}
      icon="📊"
      color={color}
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Configure Final Analysis</h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Customize the final analysis by reordering or toggling to enable/disable each section.
            The AI will analyze conversations based on this configuration.
          </p>
          
          {analysisItems.map((item, index) => (
            <AnalysisItem 
              key={item.id} 
              item={item} 
              toggleItem={toggleAnalysisItem}
              moveUp={moveItemUp}
              moveDown={moveItemDown}
              isFirst={index === 0}
              isLast={index === analysisItems.length - 1}
            />
          ))}
        </div>
        
        {/* Analysis Options */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Analysis Options</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration.includeParticipantNames}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      includeParticipantNames: value
                    }
                  })}
                />
                <span className="text-gray-700">Include participant names in analysis</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, participant names will be mentioned in the analysis.
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration.includeQuotesInAnalysis}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      includeQuotesInAnalysis: value
                    }
                  })}
                />
                <span className="text-gray-700">Include direct quotes in analysis</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, the analysis will include direct quotes from the conversations.
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={analysisConfiguration.generateKeyInsights}
                  onChange={(value) => updateSessionConfig({
                    ...sessionConfig,
                    analysisConfiguration: {
                      ...analysisConfiguration,
                      generateKeyInsights: value
                    }
                  })}
                />
                <span className="text-gray-700">Generate key insights section</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                When enabled, the analysis will include a section highlighting key insights.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <NumberInput
            label="Analysis Generation Time (seconds)"
            value={analysisConfiguration.analysisGenerationTime}
            onChange={(value) => updateSessionConfig({
              ...sessionConfig,
              analysisConfiguration: {
                ...analysisConfiguration,
                analysisGenerationTime: value
              }
            })}
            min={30}
            max={300}
            step={10}
          />
          <p className="text-sm text-gray-600 mt-2">
            Time needed for the AI to generate the final analysis.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default FinalAnalysisConfig; 