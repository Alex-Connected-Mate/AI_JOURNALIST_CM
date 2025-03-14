'use client';

import { useState } from 'react';

interface AINuggetsAgentProps {
  sessionId: string;
  participantName: string;
  programName: string;
  teacherName: string;
  onClose?: () => void;
  onComplete?: (insights: string[]) => void;
}

export default function AINuggetsAgent({
  sessionId,
  participantName,
  programName,
  teacherName,
  onClose,
  onComplete
}: AINuggetsAgentProps) {
  const [step, setStep] = useState<'intro' | 'questions' | 'analysis' | 'results'>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Sample questions for the nuggets agent
  const questions = [
    "What's the most important business concept you've learned in this session?",
    "How might you apply this knowledge in a real-world business situation?",
    "What challenges do you think businesses face in implementing these concepts?",
    "Can you identify any potential opportunities for innovation based on what you've learned?"
  ];
  
  const handleNext = () => {
    if (step === 'intro') {
      setStep('questions');
    } else if (step === 'questions') {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // All questions answered, move to analysis
        setLoading(true);
        // Simulate AI processing time
        setTimeout(() => {
          setStep('analysis');
          // Simulate analysis time
          setTimeout(() => {
            // Generate insights based on answers
            const generatedInsights = [
              "Key business concept identified: Strategic value creation through customer-centric approaches",
              "Potential application: Implementing feedback loops in product development cycles",
              "Challenge: Balancing innovation with practical implementation constraints",
              "Opportunity: Exploring untapped market segments through innovative business models"
            ];
            setInsights(generatedInsights);
            setStep('results');
            setLoading(false);
          }, 2000);
        }, 1500);
      }
    } else if (step === 'results') {
      if (onComplete) {
        onComplete(insights);
      }
    }
  };
  
  const handleAnswerChange = (answer: string) => {
    setAnswers({
      ...answers,
      [`question_${currentQuestion}`]: answer
    });
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">AI Nuggets</h2>
            <p className="text-sm text-indigo-200">Extract valuable business insights</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-500 transition-colors"
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
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-6">
              <span className="text-5xl">💎</span>
            </div>
            <h3 className="text-2xl font-semibold mb-4">Welcome to AI Nuggets</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              I'll help you extract the most valuable business insights from this session.
              Let's work together to identify key concepts, applications, and opportunities.
            </p>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
        
        {step === 'questions' && (
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-3">
                  {currentQuestion + 1}
                </div>
                <div className="text-xl font-medium text-gray-800">
                  {questions[currentQuestion]}
                </div>
              </div>
              
              <textarea
                value={answers[`question_${currentQuestion}`] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <button
                onClick={handleNext}
                disabled={!answers[`question_${currentQuestion}`]}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  answers[`question_${currentQuestion}`]
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Submit Answers'}
              </button>
            </div>
          </div>
        )}
        
        {step === 'analysis' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyzing Your Responses</h3>
            <p className="text-gray-600">
              Please wait while I extract key business insights from your responses...
            </p>
          </div>
        )}
        
        {step === 'results' && (
          <div className="max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-4">Your Business Nuggets</h3>
            <p className="text-gray-600 mb-6">
              Based on your responses, I've extracted these valuable business insights:
            </p>
            
            <div className="space-y-4 mb-8">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center">
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
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Complete & Save Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 