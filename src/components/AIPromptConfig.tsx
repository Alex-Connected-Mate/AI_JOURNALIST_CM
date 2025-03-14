import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BookSection {
  title: string;
  description: string;
  themes: string[];
}

interface AIPromptConfig {
  agentName: string;
  programName: string;
  teacherName: string;
  customRules: string[];
  customQuestions: {
    id: string;
    question: string;
  }[];
  analysisConfig: {
    themes: string[];
    keywordsPerTheme: { [theme: string]: string[] };
    sentimentAnalysis: boolean;
    extractKeyInsights: boolean;
  };
  bookConfig: {
    sections: {
      id: string;
      title: string;
      description: string;
      themes: string[];
    }[];
    visualStyle: {
      colorScheme: string;
      fontStyle: string;
      coverImagePrompt: string;
      generateImages: boolean;
      imageStyle: string;
      pageBackgroundColor: string;
      textColor: string;
      accentColor: string;
      logoUrl?: string;
    };
  };
}

const DEFAULT_RULES = [
  "Assurer la confidentialité des informations des participants",
  "Suivre les questions dans l'ordre établi",
  "Demander des clarifications si nécessaire",
  "Ne pas sauter de questions",
  "Conclure uniquement après avoir tout complété"
];

const DEFAULT_QUESTIONS = [
  {
    id: '1',
    question: 'What is the main problem or opportunity your business is addressing?'
  },
  {
    id: '2',
    question: 'How does your solution stand out from others in the market?'
  },
  {
    id: '3',
    question: 'Who are your primary customers or users, and what do they value most?'
  },
  {
    id: '4',
    question: 'What measurable impact have you achieved so far, or what are you aiming for?'
  },
  {
    id: '5',
    question: 'How do you plan to scale this solution, and what is your long-term vision?'
  }
];

const DEFAULT_ANALYSIS_CONFIG = {
  themes: [],
  keywordsPerTheme: {},
  sentimentAnalysis: true,
  extractKeyInsights: true
};

const DEFAULT_BOOK_CONFIG = {
  sections: [],
  visualStyle: {
    colorScheme: 'professional',
    fontStyle: 'modern',
    coverImagePrompt: '',
    generateImages: true,
    imageStyle: 'realistic',
    pageBackgroundColor: '#ffffff',
    textColor: '#333333',
    accentColor: '#4f46e5',
    logoUrl: ''
  }
};

export function AIPromptConfig({ onSave, initialConfig, agentType = 'nuggets' }: { 
  onSave: (config: AIPromptConfig) => void, 
  initialConfig?: AIPromptConfig,
  agentType?: 'nuggets' | 'lightbulbs' 
}) {
  const [config, setConfig] = useState<AIPromptConfig>({
    agentName: initialConfig?.agentName || (agentType === 'nuggets' ? 'AI Nuggets' : 'AI Lightbulbs'),
    programName: initialConfig?.programName || '',
    teacherName: initialConfig?.teacherName || '',
    customRules: initialConfig?.customRules || [],
    customQuestions: initialConfig?.customQuestions || DEFAULT_QUESTIONS,
    analysisConfig: initialConfig?.analysisConfig || DEFAULT_ANALYSIS_CONFIG,
    bookConfig: initialConfig?.bookConfig || DEFAULT_BOOK_CONFIG
  });

  const [activeTab, setActiveTab] = useState('config');
  const [newRule, setNewRule] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [newBookSection, setNewBookSection] = useState<BookSection>({
    title: '',
    description: '',
    themes: []
  });

  const updateConfig = (field: keyof AIPromptConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCustomRule = () => {
    if (newRule.trim()) {
      setConfig(prev => ({
        ...prev,
        customRules: [...prev.customRules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeCustomRule = (index: number) => {
    setConfig(prev => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionChange = (id: string, newQuestion: string) => {
    setConfig(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q =>
        q.id === id ? { ...q, question: newQuestion } : q
      )
    }));
  };

  const addQuestion = () => {
    const newId = (config.customQuestions.length + 1).toString();
    setConfig(prev => ({
      ...prev,
      customQuestions: [
        ...prev.customQuestions,
        { id: newId, question: '' }
      ]
    }));
  };

  const removeQuestion = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id)
    }));
  };

  const generatePrompt = () => {
    return `# Configuration de l'Agent AI Nuggets

## Identité de l'Agent
Nom de l'Agent: "${config.agentName}"
Programme: "${config.programName}"
Professeur: "${config.teacherName}"

## Règles de Base
${DEFAULT_RULES.map(rule => `• ${rule}`).join('\n')}

## Règles Personnalisées
${config.customRules.map(rule => `• ${rule}`).join('\n')}

## Questions à Poser
${config.customQuestions.map((q, index) => `
${index + 1}. "${q.question}"`).join('\n')}

## Structure d'Interaction

### Accueil
"Bonjour ! Bienvenue à "${config.programName}". On m'a dit que vous aviez une belle histoire à partager ! Je suis ${config.agentName}, votre journaliste AI aujourd'hui. Alors, quelle est votre histoire ? 😊"

### Conclusion
"Parfait, maintenant retournons à ${config.teacherName} pour examiner ensemble toutes les contributions ! Merci beaucoup pour votre temps et vos réponses. N'hésitez pas si vous souhaitez partager autre chose. Passez une excellente journée !"`;
  };

  const addTheme = () => {
    if (newTheme.trim()) {
      setConfig(prev => ({
        ...prev,
        analysisConfig: {
          ...prev.analysisConfig,
          themes: [...prev.analysisConfig.themes, newTheme.trim()],
          keywordsPerTheme: {
            ...prev.analysisConfig.keywordsPerTheme,
            [newTheme.trim()]: []
          }
        }
      }));
      setNewTheme('');
    }
  };

  const addKeywordToTheme = (theme: string) => {
    if (newKeyword.trim()) {
      setConfig(prev => ({
        ...prev,
        analysisConfig: {
          ...prev.analysisConfig,
          keywordsPerTheme: {
            ...prev.analysisConfig.keywordsPerTheme,
            [theme]: [...(prev.analysisConfig.keywordsPerTheme[theme] || []), newKeyword.trim()]
          }
        }
      }));
      setNewKeyword('');
    }
  };

  const addBookSection = () => {
    if (newBookSection.title && newBookSection.description) {
      setConfig(prev => ({
        ...prev,
        bookConfig: {
          sections: [
            ...prev.bookConfig.sections,
            {
              id: (prev.bookConfig.sections.length + 1).toString(),
              ...newBookSection
            }
          ],
          visualStyle: {
            ...prev.bookConfig.visualStyle,
            logoUrl: ''
          }
        }
      }));
      setNewBookSection({ title: '', description: '', themes: [] });
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b p-0">
          <TabsTrigger value="config" className="w-1/3">Configuration Agent</TabsTrigger>
          <TabsTrigger value="analysis" className="w-1/3">Analyse Cornea</TabsTrigger>
          <TabsTrigger value="book" className="w-1/3">Book</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <CardContent className="space-y-8 pt-6">
            {/* Configuration de Base */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Configuration de Base</h2>
              <div className="grid gap-4">
                <Input
                  label="Nom de l'Agent"
                  value={config.agentName}
                  onChange={(e) => updateConfig('agentName', e.target.value)}
                  placeholder="Ex: AI Nuggets"
                />
                <Input
                  label="Nom du Programme"
                  value={config.programName}
                  onChange={(e) => updateConfig('programName', e.target.value)}
                  placeholder="Ex: Connected Mate Workshop"
                />
                <Input
                  label="Nom du Professeur"
                  value={config.teacherName}
                  onChange={(e) => updateConfig('teacherName', e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
            </div>

            {/* Règles Prédéfinies */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Règles Prédéfinies</h2>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                {DEFAULT_RULES.map((rule, index) => (
                  <div key={index} className="text-sm text-gray-600 mb-2 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Règles Personnalisées */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Règles Personnalisées</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Ajouter une nouvelle règle"
                  />
                  <Button onClick={addCustomRule} variant="outline" className="shrink-0">
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {config.customRules.map((rule, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100">
                      <span className="text-sm flex-1">{rule}</span>
                      <Button
                        onClick={() => removeCustomRule(index)}
                        variant="destructive"
                        size="sm"
                        className="ml-2 shrink-0"
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions Personnalisées */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">Questions Personnalisées</h2>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  Ajouter une Question
                </Button>
              </div>
              <div className="space-y-3">
                {config.customQuestions.map((q, index) => (
                  <div key={q.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={q.question}
                        onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                        placeholder={`Question ${index + 1}`}
                      />
                    </div>
                    <Button
                      onClick={() => removeQuestion(q.id)}
                      variant="destructive"
                      size="sm"
                      className="shrink-0"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => onSave(config)} className="w-full mt-8">
              Sauvegarder la Configuration
            </Button>
          </CardContent>
        </TabsContent>

        <TabsContent value="analysis">
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Configuration de l'Analyse</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    placeholder="Ajouter un nouveau thème"
                  />
                  <Button onClick={addTheme} variant="outline" className="shrink-0">
                    Ajouter un Thème
                  </Button>
                </div>

                {config.analysisConfig.themes.map((theme, index) => (
                  <div key={index} className="space-y-2 bg-gray-50 p-4 rounded-md border border-gray-100">
                    <h3 className="font-medium">{theme}</h3>
                    
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Ajouter un mot-clé"
                      />
                      <Button 
                        onClick={() => addKeywordToTheme(theme)}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        Ajouter
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {config.analysisConfig.keywordsPerTheme[theme]?.map((keyword, kidx) => (
                        <div key={kidx} className="bg-white px-3 py-1 rounded-full text-sm border">
                          {keyword}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Options d'Analyse</h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.analysisConfig.sentimentAnalysis}
                      onChange={(e) => updateConfig('analysisConfig', {
                        ...config.analysisConfig,
                        sentimentAnalysis: e.target.checked
                      })}
                    />
                    Analyse de Sentiment
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.analysisConfig.extractKeyInsights}
                      onChange={(e) => updateConfig('analysisConfig', {
                        ...config.analysisConfig,
                        extractKeyInsights: e.target.checked
                      })}
                    />
                    Extraction d'Insights Clés
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="book">
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Configuration du Book</h2>
              
              {/* Visual Styling Section */}
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                <h3 className="font-medium text-lg mb-4">Style Visuel</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Color Scheme Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schéma de Couleurs</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={config.bookConfig.visualStyle.colorScheme}
                      onChange={(e) => updateConfig('bookConfig', {
                        ...config.bookConfig,
                        visualStyle: {
                          ...config.bookConfig.visualStyle,
                          colorScheme: e.target.value
                        }
                      })}
                    >
                      <option value="professional">Professionnel</option>
                      <option value="creative">Créatif</option>
                      <option value="academic">Académique</option>
                      <option value="elegant">Élégant</option>
                      <option value="bold">Dynamique</option>
                    </select>
                  </div>
                  
                  {/* Font Style Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Style de Police</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={config.bookConfig.visualStyle.fontStyle}
                      onChange={(e) => updateConfig('bookConfig', {
                        ...config.bookConfig,
                        visualStyle: {
                          ...config.bookConfig.visualStyle,
                          fontStyle: e.target.value
                        }
                      })}
                    >
                      <option value="modern">Moderne</option>
                      <option value="classic">Classique</option>
                      <option value="minimalist">Minimaliste</option>
                      <option value="playful">Ludique</option>
                      <option value="technical">Technique</option>
                    </select>
                  </div>
                  
                  {/* Custom Colors */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur de Fond</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={config.bookConfig.visualStyle.pageBackgroundColor}
                        onChange={(e) => updateConfig('bookConfig', {
                          ...config.bookConfig,
                          visualStyle: {
                            ...config.bookConfig.visualStyle,
                            pageBackgroundColor: e.target.value
                          }
                        })}
                        className="w-8 h-8 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={config.bookConfig.visualStyle.pageBackgroundColor}
                        onChange={(e) => updateConfig('bookConfig', {
                          ...config.bookConfig,
                          visualStyle: {
                            ...config.bookConfig.visualStyle,
                            pageBackgroundColor: e.target.value
                          }
                        })}
                        className="flex-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur du Texte</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={config.bookConfig.visualStyle.textColor}
                        onChange={(e) => updateConfig('bookConfig', {
                          ...config.bookConfig,
                          visualStyle: {
                            ...config.bookConfig.visualStyle,
                            textColor: e.target.value
                          }
                        })}
                        className="w-8 h-8 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={config.bookConfig.visualStyle.textColor}
                        onChange={(e) => updateConfig('bookConfig', {
                          ...config.bookConfig,
                          visualStyle: {
                            ...config.bookConfig.visualStyle,
                            textColor: e.target.value
                          }
                        })}
                        className="flex-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur d'Accent</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={config.bookConfig.visualStyle.accentColor}
                        onChange={(e) => updateConfig('bookConfig', {
                          ...config.bookConfig,
                          visualStyle: {
                            ...config.bookConfig.visualStyle,
                            accentColor: e.target.value
                          }
                        })}
                        className="w-8 h-8 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={config.bookConfig.visualStyle.accentColor}
                        onChange={(e) => updateConfig('bookConfig', {
                          ...config.bookConfig,
                          visualStyle: {
                            ...config.bookConfig.visualStyle,
                            accentColor: e.target.value
                          }
                        })}
                        className="flex-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Image Generation Options */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Génération d'Images</h4>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="generateImages"
                      checked={config.bookConfig.visualStyle.generateImages}
                      onChange={(e) => updateConfig('bookConfig', {
                        ...config.bookConfig,
                        visualStyle: {
                          ...config.bookConfig.visualStyle,
                          generateImages: e.target.checked
                        }
                      })}
                      className="h-4 w-4"
                    />
                    <label htmlFor="generateImages" className="text-sm">
                      Générer des images avec OpenAI
                    </label>
                  </div>
                  
                  {config.bookConfig.visualStyle.generateImages && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Style d'Image</label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          value={config.bookConfig.visualStyle.imageStyle}
                          onChange={(e) => updateConfig('bookConfig', {
                            ...config.bookConfig,
                            visualStyle: {
                              ...config.bookConfig.visualStyle,
                              imageStyle: e.target.value
                            }
                          })}
                        >
                          <option value="realistic">Réaliste</option>
                          <option value="abstract">Abstrait</option>
                          <option value="cartoon">Cartoon</option>
                          <option value="watercolor">Aquarelle</option>
                          <option value="minimalist">Minimaliste</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Prompt pour Image de Couverture</label>
                        <textarea 
                          value={config.bookConfig.visualStyle.coverImagePrompt}
                          onChange={(e) => updateConfig('bookConfig', {
                            ...config.bookConfig,
                            visualStyle: {
                              ...config.bookConfig.visualStyle,
                              coverImagePrompt: e.target.value
                            }
                          })}
                          placeholder="Décrivez l'image de couverture que vous souhaitez générer..."
                          className="w-full p-2 border rounded-md h-24"
                        />
                        <p className="text-xs text-gray-500">
                          Laissez vide pour une génération automatique basée sur le contenu.
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium">URL du Logo (optionnel)</label>
                    <Input
                      value={config.bookConfig.visualStyle.logoUrl || ''}
                      onChange={(e) => updateConfig('bookConfig', {
                        ...config.bookConfig,
                        visualStyle: {
                          ...config.bookConfig.visualStyle,
                          logoUrl: e.target.value
                        }
                      })}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-gray-500">
                      Logo à afficher sur la couverture et les en-têtes du book.
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium text-lg">Sections du Book</h3>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <Input
                    label="Titre de la Section"
                    value={newBookSection.title}
                    onChange={(e) => setNewBookSection(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Ex: Innovations Technologiques"
                  />
                  <Input
                    label="Description"
                    value={newBookSection.description}
                    onChange={(e) => setNewBookSection(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Description de la section"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thèmes Associés</label>
                    <div className="flex flex-wrap gap-2">
                      {config.analysisConfig.themes.map((theme, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const isSelected = newBookSection.themes.includes(theme);
                            setNewBookSection(prev => ({
                              ...prev,
                              themes: isSelected
                                ? prev.themes.filter(t => t !== theme)
                                : [...prev.themes, theme]
                            }));
                          }}
                          className={`px-3 py-1 rounded-full text-sm border ${
                            newBookSection.themes.includes(theme)
                              ? 'bg-primary text-white'
                              : 'bg-white'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={addBookSection} className="w-full">
                  Ajouter la Section
                </Button>

                <div className="space-y-4">
                  {config.bookConfig.sections.map((section, index) => (
                    <div key={section.id} className="bg-gray-50 p-4 rounded-md border border-gray-100">
                      <h3 className="font-medium">{section.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {section.themes.map((theme, tidx) => (
                          <span key={tidx} className="bg-white px-2 py-1 rounded-full text-xs border">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 