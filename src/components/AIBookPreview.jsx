import React, { useState } from 'react';

/**
 * Enhanced Book Preview Component
 * 
 * This component displays a preview of the AI Book that will be generated
 * with insights from participant discussions. It provides an interactive
 * way to visualize how the final book will look, with a focus on immersive themes.
 */
const AIBookPreview = ({ 
  config, 
  onConfigChange,
  agentType = 'nuggets', // 'nuggets' or 'lightbulbs'
  participantName = "Participant" // Name of the participant for customization
}) => {
  const [showCover, setShowCover] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  
  // Default colors based on agent type
  const defaultColors = {
    nuggets: {
      primary: '#4f46e5', // indigo
      secondary: '#818cf8', // indigo lighter
      background: '#eef2ff', // indigo lightest
      text: '#1e1b4b', // indigo darkest
    },
    lightbulbs: {
      primary: '#f59e0b', // amber
      secondary: '#fbbf24', // amber lighter
      background: '#fffbeb', // amber lightest
      text: '#78350f', // amber darkest
    }
  };
  
  // Get appropriate colors
  const agentColors = defaultColors[agentType];
  
  // Available themes with comprehensive styling
  const bookThemes = {
    modern: {
      name: "Modern",
      description: "Clean, minimal design with contemporary typography",
      coverStyle: {
        background: "#ffffff", 
        textColor: "#333333",
        accentColor: agentColors.primary,
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        fontFamily: "'Inter', sans-serif",
        pattern: null
      },
      pageStyle: {
        background: "#ffffff", 
        textColor: "#333333",
        accentColor: agentColors.primary,
        borderRadius: "0.75rem",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        fontFamily: "'Inter', sans-serif",
        bulletStyle: "circle",
        pattern: null
      }
    },
    medieval: {
      name: "Medieval Parchment",
      description: "Aged parchment design with elegant serif typography",
      coverStyle: {
        background: "#f3e8c8", 
        textColor: "#4b3621",
        accentColor: "#8b0000",
        borderRadius: "0.375rem",
        boxShadow: "0 4px 14px -2px rgba(75, 54, 33, 0.3)",
        fontFamily: "'EB Garamond', serif",
        pattern: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJESURBVGhD7ZixahRRFIb/WdRCMCpEAoKkEIJVEIJYWFgFH8BCfAELX8BKrCx9AhsrX8DGwkpIoWBjYWEXiCJJsNBdz/ffc2dn7t2Z3cwUM7PnhwP3zNm7c//MOfeembOJk5wS5GHkpCKR/x15KBU/xt/z/Rr1/Unj/j7UmUXqH1KV3jE9Z3U6vWxcK4s+8XAeJRLZ2dm5Z/Y6AeNtRc8V8e52u73Z6XRWU8jYbO3v7z80ex0Se8rsNXrG3vb29m2ztTGWyMbGxiOzNWtQxK8wPAQ6kkhjHNGHdpZ4N2FILgfGEhGhG46TcHZMJGJmZ8JYzUPkUY3T7rVs0wgyqbknkUQiUxHZ3d19IRGLN9rt1g3LaoTYX6WIRUZa14dNjRGqZUzkMSuTl+9dLdnc3DzUeodMzLd8M0yjqVXGcBxzLqtGIpGpizwqzuROKpVeyEOr7mq1Wn3GuxWdJ5HmSCKRqYsMaoK/dGwVuBuNZsB04rZELH4xvJRKpXfmvpUPGZmO9czW7vKGRB5oxLI76VwZRWQonWdCyZFEIlMR+WPvz0fxjUQ+M9y3G4qr3d4t5iJqOKwY5qpyN3+Y3RG6FYyvqbKncj4y84eVLttnNRmL5B1JJHJ8IvqD8VyVIE6c/GX4QhVhrUf7HzVBMZnuBQ37lnvWYl1WVf7gPvIU65JFHHWNU2vEbhFfTCQS+f9FYtfuZZ2sZOZKcg2kVlKR0whDwpxLtXAcJ5jkH6aHOb8WU+OGAAAAAElFTkSuQmCC')"
      },
      pageStyle: {
        background: "#f8f4e8", 
        textColor: "#4b3621",
        accentColor: "#8b0000",
        borderRadius: "0.375rem",
        boxShadow: "0 4px 14px -2px rgba(75, 54, 33, 0.2)",
        fontFamily: "'EB Garamond', serif",
        bulletStyle: "square",
        pattern: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJESURBVGhD7ZixahRRFIb/WdRCMCpEAoKkEIJVEIJYWFgFH8BCfAELX8BKrCx9AhsrX8DGwkpIoWBjYWEXiCJJsNBdz/ffc2dn7t2Z3cwUM7PnhwP3zNm7c//MOfeembOJk5wS5GHkpCKR/x15KBU/xt/z/Rr1/Unj/j7UmUXqH1KV3jE9Z3U6vWxcK4s+8XAeJRLZ2dm5Z/Y6AeNtRc8V8e52u73Z6XRWU8jYbO3v7z80ex0Se8rsNXrG3vb29m2ztTGWyMbGxiOzNWtQxK8wPAQ6kkhjHNGHdpZ4N2FILgfGEhGhG46TcHZMJGJmZ8JYzUPkUY3T7rVs0wgyqbknkUQiUxHZ3d19IRGLN9rt1g3LaoTYX6WIRUZa14dNjRGqZUzkMSuTl+9dLdnc3DzUeodMzLd8M0yjqVXGcBxzLqtGIpGpizwqzuROKpVeyEOr7mq1Wn3GuxWdJ5HmSCKRqYsMaoK/dGwVuBuNZsB04rZELH4xvJRKpXfmvpUPGZmO9czW7vKGRB5oxLI76VwZRWQonWdCyZFEIlMR+WPvz0fxjUQ+M9y3G4qr3d4t5iJqOKwY5qpyN3+Y3RG6FYyvqbKncj4y84eVLttnNRmL5B1JJHJ8IvqD8VyVIE6c/GX4QhVhrUf7HzVBMZnuBQ37lnvWYl1WVf7gPvIU65JFHHWNU2vEbhFfTCQS+f9FYtfuZZ2sZOZKcg2kVlKR0whDwpxLtXAcJ5jkH6aHOb8WU+OGAAAAAElFTkSuQmCC')"
      }
    },
    futuristic: {
      name: "Futuristic",
      description: "Bold, tech-inspired design with modern elements",
      coverStyle: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
        textColor: "#e2e8f0",
        accentColor: "#38bdf8",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 30px -5px rgba(14, 165, 233, 0.3)",
        fontFamily: "'Space Mono', monospace",
        pattern: null
      },
      pageStyle: {
        background: "#0f172a", 
        textColor: "#e2e8f0",
        accentColor: "#38bdf8",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 30px -5px rgba(14, 165, 233, 0.2)",
        fontFamily: "'Space Mono', monospace",
        bulletStyle: "none",
        pattern: null
      }
    },
    nature: {
      name: "Natural",
      description: "Organic design inspired by natural elements",
      coverStyle: {
        background: "#f0f9e8", 
        textColor: "#2d3b29",
        accentColor: "#588157",
        borderRadius: "1rem",
        boxShadow: "0 10px 25px -5px rgba(88, 129, 87, 0.2)",
        fontFamily: "'Quicksand', sans-serif",
        pattern: null
      },
      pageStyle: {
        background: "#f8fafc", 
        textColor: "#2d3b29",
        accentColor: "#588157",
        borderRadius: "1rem",
        boxShadow: "0 6px 15px -3px rgba(88, 129, 87, 0.1)",
        fontFamily: "'Quicksand', sans-serif",
        bulletStyle: "leaf",
        pattern: null
      }
    },
    elegant: {
      name: "Elegant",
      description: "Sophisticated design with premium aesthetic",
      coverStyle: {
        background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)", 
        textColor: "#f5f5f4",
        accentColor: "#ca8a04",
        borderRadius: "0.5rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        fontFamily: "'Playfair Display', serif",
        pattern: null
      },
      pageStyle: {
        background: "#ffffff", 
        textColor: "#1c1917",
        accentColor: "#ca8a04",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        fontFamily: "'Playfair Display', serif",
        bulletStyle: "diamond",
        pattern: null
      }
    }
  };
  
  // Get current theme (or default to modern)
  const currentThemeName = config.visualStyle?.theme || 'modern';
  const currentTheme = bookThemes[currentThemeName] || bookThemes.modern;
  
  // Handle theme change
  const handleThemeChange = (themeName) => {
    if (!bookThemes[themeName]) return;
    
    const updatedVisualStyle = {
      ...config.visualStyle,
      theme: themeName,
    };
    
    onConfigChange({
      ...config,
      visualStyle: updatedVisualStyle
    });
  };
  
  // Handle other style changes
  const handleStyleChange = (field, value) => {
    const updatedVisualStyle = {
      ...config.visualStyle,
      [field]: value
    };
    
    onConfigChange({
      ...config,
      visualStyle: updatedVisualStyle
    });
  };
  
  // Sample content for preview
  const sampleInsights = agentType === 'nuggets' ? [
    "Market research indicates a 15% increase in demand for sustainable products",
    "Customer feedback highlighted performance issues in the mobile app",
    "Competitors are focusing heavily on AI integration in their offerings",
    "European market shows different usage patterns compared to North America",
    "User retention improved significantly after the latest update"
  ] : [
    "Create a subscription-based service for sustainable product recommendations",
    "Integrate AR functionality to enhance the in-store shopping experience",
    "Develop a community-driven platform for user-generated sustainable recipes",
    "Launch a carbon footprint calculator with personalized offset suggestions",
    "Partner with local businesses for a circular economy initiative"
  ];
  
  // Book cover component with theme styling
  const BookCover = () => {
    const theme = currentTheme.coverStyle;
    const showParticipantName = config.visualStyle?.showParticipantName ?? true;
    
    return (
      <div 
        className="book-cover relative overflow-hidden rounded-lg shadow-xl"
        style={{
          aspectRatio: '1/1.4',
          background: theme.background,
          color: theme.textColor,
          maxWidth: '300px',
          margin: '0 auto',
          borderRadius: theme.borderRadius,
          boxShadow: theme.boxShadow,
          fontFamily: theme.fontFamily
        }}
      >
        {/* Pattern background if applicable */}
        {theme.pattern && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: theme.pattern
            }}></div>
          </div>
        )}
        
        {/* Image placeholder */}
        {config.visualStyle?.generateImages && (
          <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{
            backgroundImage: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/sample-cover-bg.jpg')"
          }}></div>
        )}
        
        {/* Cover content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          {/* Logo if available */}
          {config.visualStyle?.logoUrl && (
            <div className="w-full flex justify-end">
              <img 
                src={config.visualStyle.logoUrl} 
                alt="Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
          )}
          
          {/* Title and info */}
          <div className="mx-auto text-center mt-8 z-10">
            <h2 className="text-xl font-bold mb-3" style={{ color: theme.textColor }}>
              {agentType === 'nuggets' ? 'Insights & Discoveries' : 'Creative Innovations'}
            </h2>
            
            <p className="text-sm opacity-90">Session insights 
              {showParticipantName && participantName ? ` for ${participantName}` : ''}
            </p>
            
            <div 
              className="w-20 h-1 mx-auto my-4"
              style={{ backgroundColor: theme.accentColor }}
            ></div>
            
            <p className="text-lg mt-2">
              {agentType === 'nuggets' ? 'Elias' : 'Sonia'}
            </p>
          </div>
          
          {/* Bottom decoration */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: `${theme.accentColor}20`,
                borderColor: theme.textColor
              }}
            >
              <span className="text-2xl" style={{ color: theme.accentColor }}>
                {agentType === 'nuggets' ? 'E' : 'S'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Book page component with theme styling
  const BookPage = ({ pageNumber }) => {
    const theme = currentTheme.pageStyle;
    const showParticipantName = config.visualStyle?.showParticipantName ?? true;
    
    // Get section based on page number (or use dummy if not available)
    const section = config.sections && config.sections[pageNumber] 
      ? config.sections[pageNumber]
      : { 
          title: agentType === 'nuggets' ? 'Key Insights' : 'Creative Ideas', 
          description: agentType === 'nuggets' 
            ? 'Important information extracted from the discussions'
            : 'Innovative concepts developed from the discussions'
        };
        
    // Get insights for this page
    const pageInsights = sampleInsights.slice(0, 3);
    
    // Image placeholder styling
    const imagePlaceholder = config.visualStyle?.generateImages ? (
      <div className="w-full h-32 bg-gray-200 rounded mb-4 flex items-center justify-center" style={{
        backgroundColor: `${theme.accentColor}10`,
        borderRadius: theme.borderRadius
      }}>
        <div className="text-center p-2">
          <div className="text-xs mb-1" style={{ color: theme.accentColor }}>Image will be generated based on insights</div>
          <div style={{ color: theme.accentColor }}>🖼️</div>
        </div>
      </div>
    ) : null;
    
    return (
      <div 
        className="book-page relative overflow-hidden rounded-lg shadow-lg"
        style={{
          aspectRatio: '1/1.4',
          backgroundColor: theme.background,
          color: theme.textColor,
          maxWidth: '300px',
          margin: '0 auto',
          borderRadius: theme.borderRadius,
          boxShadow: theme.boxShadow,
          fontFamily: theme.fontFamily
        }}
      >
        {/* Background pattern if applicable */}
        {theme.pattern && (
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: theme.pattern
            }}></div>
          </div>
        )}
        
        {/* Page content */}
        <div className="absolute inset-0 p-6 flex flex-col">
          {/* Header with page number and section */}
          <div className="flex justify-between items-center mb-4">
            <h3 
              className="text-lg font-bold"
              style={{ color: theme.accentColor }}
            >
              {section.title}
            </h3>
            <span 
              className="text-sm opacity-70"
              style={{ color: theme.textColor }}
            >
              {pageNumber + 1}
            </span>
          </div>
          
          {/* Section description */}
          <p 
            className="text-sm mb-4"
            style={{ color: theme.textColor }}
          >
            {section.description}
          </p>
          
          {/* Image placeholder */}
          {imagePlaceholder}
          
          {/* Divider */}
          <div 
            className="w-12 h-0.5 mb-4"
            style={{ backgroundColor: theme.accentColor }}
          ></div>
          
          {/* Content */}
          <div className="flex-grow">
            <ul className="space-y-3">
              {pageInsights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <BulletPoint type={theme.bulletStyle} color={theme.accentColor} />
                  <p className="text-sm ml-2">
                    {insight}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Footer with agent branding */}
          <div className="flex justify-between items-center mt-6 pt-3 border-t" style={{ borderColor: `${theme.accentColor}30` }}>
            <span className="text-xs opacity-70">
              {agentType === 'nuggets' ? 'Elias AI Nuggets' : 'Sonia AI Lightbulbs'}
              {showParticipantName && participantName ? ` - ${participantName}` : ''}
            </span>
            <span className="text-xs opacity-70">
              Connected Mate
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  // Custom bullet point component
  const BulletPoint = ({ type, color }) => {
    switch(type) {
      case 'square':
        return (
          <div className="w-3 h-3 mt-1 mr-1 flex-shrink-0" 
            style={{ backgroundColor: color }}></div>
        );
      case 'diamond':
        return (
          <div className="w-3 h-3 mt-1 mr-1 flex-shrink-0 rotate-45" 
            style={{ backgroundColor: color }}></div>
        );
      case 'leaf':
        return (
          <div className="flex-shrink-0 mt-1 mr-1 text-lg" style={{ color }}>•</div>
        );
      case 'none':
        return (
          <div className="w-4 flex-shrink-0"></div>
        );
      case 'circle':
      default:
        return (
          <div className="w-3 h-3 mt-1 mr-1 rounded-full flex-shrink-0" 
            style={{ backgroundColor: color }}></div>
        );
    }
  };
  
  return (
    <div className="ai-book-preview space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Book Preview
        </h3>
        <div className="space-x-2">
          <button 
            onClick={() => setShowCover(true)}
            className={`px-3 py-1 text-sm rounded-md ${
              showCover 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cover
          </button>
          <button 
            onClick={() => setShowCover(false)}
            className={`px-3 py-1 text-sm rounded-md ${
              !showCover 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pages
          </button>
        </div>
      </div>
      
      {/* Preview area */}
      <div className="preview-container">
        {showCover ? (
          <BookCover />
        ) : (
          <div className="page-viewer">
            <BookPage pageNumber={previewPage} />
            
            {/* Page navigation */}
            <div className="flex justify-center mt-4 space-x-2">
              <button 
                onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                disabled={previewPage === 0}
                className="p-1 rounded-full bg-gray-200 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-sm">Page {previewPage + 1} of {Math.max(1, config.sections?.length || 1)}</span>
              <button 
                onClick={() => setPreviewPage(Math.min((config.sections?.length || 1) - 1, previewPage + 1))}
                disabled={previewPage >= (config.sections?.length || 1) - 1}
                className="p-1 rounded-full bg-gray-200 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Theme selection - simplified interface */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
        <h4 className="text-md font-medium mb-4">Book Theme</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(bookThemes).map(([themeKey, theme]) => (
            <div
              key={themeKey}
              onClick={() => handleThemeChange(themeKey)}
              className={`cursor-pointer p-3 rounded-lg border transition-all ${
                currentThemeName === themeKey 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="h-8 w-full rounded-md mb-2"
                style={{ 
                  background: typeof theme.coverStyle.background === 'string' ? theme.coverStyle.background : theme.coverStyle.accentColor,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              ></div>
              <div className="font-medium text-sm">{theme.name}</div>
              <div className="text-xs text-gray-500">{theme.description}</div>
            </div>
          ))}
        </div>
        
        {/* Additional options */}
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium mb-2">Display Options</h5>
            <div className="flex flex-col gap-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={config.visualStyle?.showParticipantName ?? true}
                  onChange={(e) => handleStyleChange('showParticipantName', e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300"
                />
                Show participant name
              </label>
              
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={config.visualStyle?.generateImages ?? true}
                  onChange={(e) => handleStyleChange('generateImages', e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300"
                />
                Include AI-generated images
              </label>
            </div>
          </div>
          
          {config.visualStyle?.generateImages && (
            <div>
              <label className="block text-sm font-medium mb-2">Image Style</label>
              <select
                value={config.visualStyle?.imageStyle || 'realistic'}
                onChange={(e) => handleStyleChange('imageStyle', e.target.value)}
                className="w-full p-2 text-sm border rounded-md"
              >
                <option value="realistic">Realistic Photography</option>
                <option value="watercolor">Watercolor Painting</option>
                <option value="3d">3D Rendering</option>
                <option value="cartoon">Cartoon Illustration</option>
                <option value="minimalist">Minimalist Design</option>
                <option value="sketch">Pencil Sketch</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Images will be generated based on insights from the conversation.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Information note */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700">
        <p>Book content will be generated from insights extracted from the participant's conversation.</p>
      </div>
    </div>
  );
};

export default AIBookPreview; 