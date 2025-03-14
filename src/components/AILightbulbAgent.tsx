'use client';

import { useState } from 'react';

interface AILightbulbAgentProps {
  sessionId: string;
  participantName: string;
  programName: string;
  teacherName: string;
  onClose?: () => void;
  onComplete?: (insights: string[]) => void;
}

export default function AILightbulbAgent({
  sessionId,
  participantName,
  programName,
  teacherName,
  onClose,
  onComplete
}: AILightbulbAgentProps) {
  const [step, setStep] = useState<'intro' | 'ideation' | 'development' | 'results'>('intro');
  const [mainIdea, setMainIdea] = useState('');
  const [ideaDetails, setIdeaDetails] = useState('');
  const [challenges, setChallenges] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleNext = () => {
    if (step === 'intro') {
      setStep('ideation');
    } else if (step === 'ideation') {
      if (!mainIdea) return;
      setStep('development');
    } else if (step === 'development') {
      if (!ideaDetails || !challenges) return;
      
      // Generate creative insights
      setLoading(true);
      setTimeout(() => {
        const generatedInsights = [
          `Innovative Concept: ${mainIdea}`,
          "Key Implementation Strategy: Develop an MVP to test with early adopters",
          "Potential Pivot Direction: Consider alternative market segments if initial traction is slow",
          "Growth Opportunity: Build strategic partnerships to accelerate adoption",
          "Risk Mitigation: Create contingency plans for the challenges identified"
        ];
        setInsights(generatedInsights);
        setStep('results');
        setLoading(false);
      }, 2500);
    } else if (step === 'results') {
      if (onComplete) {
        onComplete(insights);
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-amber-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">AI Lightbulb</h2>
            <p className="text-sm text-amber-200">Creative idea development</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-amber-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        {step === 'intro' && (
          <div className="text-center py-8">
            <div className="inline-block p-4 bg-amber-100 rounded-full mb-6">
              <span className="text-5xl">💡</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4">Welcome to AI Lightbulb</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              I'll help you develop creative ideas and innovative solutions based on the concepts from this session.
              Let's transform knowledge into innovative possibilities!
            </p>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Let's Create!
            </button>
          </div>
        )}
        
        {step === 'ideation' && (
          <div className="max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-4">Spark Your Innovation</h3>
            <p className="text-gray-600 mb-6">
              Let's start by capturing your main innovative idea. What concept would you like to develop?
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Main Idea
              </label>
              <textarea
                value={mainIdea}
                onChange={(e) => setMainIdea(e.target.value)}
                placeholder="Describe your innovative idea..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!mainIdea}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  mainIdea
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next Step
              </button>
            </div>
          </div>
        )}
        
        {step === 'development' && (
          <div className="max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-4">Develop Your Concept</h3>
            <p className="text-gray-600 mb-6">
              Let's expand on your idea and consider potential challenges.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Implementation Details
                </label>
                <textarea
                  value={ideaDetails}
                  onChange={(e) => setIdeaDetails(e.target.value)}
                  placeholder="How would you implement this idea? What resources would you need?"
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potential Challenges
                </label>
                <textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="What obstacles might you face? How might you overcome them?"
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNext}
                disabled={!ideaDetails || !challenges}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  ideaDetails && challenges
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Generate Insights
              </button>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Generating Creative Insights</h3>
            <p className="text-gray-600">
              Please wait while I process your idea and develop innovative insights...
            </p>
          </div>
        )}
        
        {step === 'results' && !loading && (
          <div className="max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-4">Your Innovation Insights</h3>
            <p className="text-gray-600 mb-6">
              Based on your idea, here are some insights to help you develop it further:
            </p>
            
            <div className="space-y-4 mb-8">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-800">{insight}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Complete & Save Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 