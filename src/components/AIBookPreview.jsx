import React, { useState } from 'react';

/**
 * Enhanced Book Preview Component
 * 
 * This component displays a preview of the AI Book that will be generated
 * with insights from participant discussions. It provides an interactive
 * way to visualize how the final book will look, with customizable styles.
 */
const AIBookPreview = ({ 
  config, 
  onConfigChange,
  agentType = 'nuggets' // 'nuggets' or 'lightbulbs'
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
  
  // Handle style changes
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
  
  // Book cover component
  const BookCover = () => {
    // Determine styles based on config and agent type
    const coverStyle = config.visualStyle?.coverStyle || 'modern';
    const backgroundColor = config.visualStyle?.coverBackgroundColor || agentColors.background;
    const textColor = config.visualStyle?.coverTextColor || agentColors.text;
    const accentColor = config.visualStyle?.accentColor || agentColors.primary;
    
    return (
      <div 
        className="book-cover relative overflow-hidden rounded-lg shadow-xl"
        style={{
          aspectRatio: '1/1.4',
          background: coverStyle === 'gradient' 
            ? `linear-gradient(to bottom right, ${accentColor}, ${backgroundColor})`
            : backgroundColor,
          color: textColor,
          maxWidth: '300px',
          margin: '0 auto'
        }}
      >
        {/* Cover image or pattern */}
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
            <h2 className={`text-xl font-bold mb-3 ${
              coverStyle === 'vintage' ? 'font-serif' : 
              coverStyle === 'tech' ? 'font-mono' : 
              coverStyle === 'artistic' ? 'font-sans italic' : 'font-sans'
            }`} style={{ color: textColor }}>
              {agentType === 'nuggets' ? 'Insights & Discoveries' : 'Creative Innovations'}
            </h2>
            
            <p className="text-sm opacity-90">Session insights from</p>
            
            <div 
              className="w-20 h-1 mx-auto my-4"
              style={{ backgroundColor: accentColor }}
            ></div>
            
            <p className={`text-lg mt-2 ${
              coverStyle === 'vintage' ? 'font-serif' : 
              coverStyle === 'tech' ? 'font-mono' : 'font-sans'
            }`}>
              {agentType === 'nuggets' ? 'Elias' : 'Sonia'}
            </p>
          </div>
          
          {/* Bottom decoration */}
          <div className="flex justify-center mb-6">
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                coverStyle === 'vintage' ? 'border-2' : 
                coverStyle === 'tech' ? 'bg-opacity-20' : 
                'bg-opacity-20'
              }`}
              style={{ 
                backgroundColor: accentColor,
                borderColor: textColor
              }}
            >
              <span className="text-2xl">{agentType === 'nuggets' ? 'E' : 'S'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Book page component
  const BookPage = ({ pageNumber }) => {
    // Determine styles based on config and agent type
    const theme = config.visualStyle?.theme || 'modern';
    const fontStyle = config.visualStyle?.fontStyle || 'sans-serif';
    const backgroundColor = config.visualStyle?.pageBackgroundColor || '#ffffff';
    const textColor = config.visualStyle?.textColor || '#333333';
    const accentColor = config.visualStyle?.accentColor || agentColors.primary;
    
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
    
    return (
      <div 
        className="book-page relative overflow-hidden rounded-lg shadow-lg"
        style={{
          aspectRatio: '1/1.4',
          backgroundColor: backgroundColor,
          color: textColor,
          maxWidth: '300px',
          margin: '0 auto'
        }}
      >
        {/* Page background */}
        {theme === 'vintage' && (
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJESURBVGhD7ZixahRRFIb/WdRCMCpEAoKkEIJVEIJYWFgFH8BCfAELX8BKrCx9AhsrX8DGwkpIoWBjYWEXiCJJsNBdz/ffc2dn7t2Z3cwUM7PnhwP3zNm7c//MOfeembOJk5wS5GHkpCKR/x15KBU/xt/z/Rr1/Unj/j7UmUXqH1KV3jE9Z3U6vWxcK4s+8XAeJRLZ2dm5Z/Y6AeNtRc8V8e52u73Z6XRWU8jYbO3v7z80ex0Se8rsNXrG3vb29m2ztTGWyMbGxiOzNWtQxK8wPAQ6kkhjHNGHdpZ4N2FILgfGEhGhG46TcHZMJGJmZ8JYzUPkUY3T7rVs0wgyqbknkUQiUxHZ3d19IRGLN9rt1g3LaoTYX6WIRUZa14dNjRGqZUzkMSuTl+9dLdnc3DzUeodMzLd8M0yjqVXGcBxzLqtGIpGpizwqzuROKpVeyEOr7mq1Wn3GuxWdJ5HmSCKRqYsMaoK/dGwVuBuNZsB04rZELH4xvJRKpXfmvpUPGZmO9czW7vKGRB5oxLI76VwZRWQonWdCyZFEIlMR+WPvz0fxjUQ+M9y3G4qr3d4t5iJqOKwY5qpyN3+Y3RG6FYyvqbKncj4y84eVLttnNRmL5B1JJHJ8IvqD8VyVIE6c/GX4QhVhrUf7HzVBMZnuBQ37lnvWYl1WVf7gPvIU65JFHHWNU2vEbhFfTCQS+f9FYtfuZZ2sZOZKcg2kVlKR0whDwpxLtXAcJ5jkH6aHOb8WU+OGAAAAAElFTkSuQmCC')"
            }}></div>
          </div>
        )}
        
        {/* Page content */}
        <div className="absolute inset-0 p-6 flex flex-col">
          {/* Header with page number and section */}
          <div className="flex justify-between items-center mb-4">
            <h3 
              className={`text-lg font-bold ${
                fontStyle === 'serif' ? 'font-serif' : 
                fontStyle === 'modern' ? 'font-mono' : 'font-sans'
              }`}
              style={{ color: accentColor }}
            >
              {section.title}
            </h3>
            <span 
              className="text-sm opacity-70"
              style={{ color: textColor }}
            >
              {pageNumber + 1}
            </span>
          </div>
          
          {/* Section description */}
          <p 
            className={`text-sm mb-4 ${
              fontStyle === 'serif' ? 'font-serif italic' : 
              fontStyle === 'modern' ? 'font-mono text-xs' : 'font-sans'
            }`}
            style={{ color: textColor }}
          >
            {section.description}
          </p>
          
          {/* Divider */}
          <div 
            className="w-12 h-0.5 mb-4"
            style={{ backgroundColor: accentColor }}
          ></div>
          
          {/* Content */}
          <div className="flex-grow">
            <ul className="space-y-3">
              {pageInsights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <div 
                    className="w-4 h-4 mt-0.5 mr-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  ></div>
                  <p 
                    className={`text-sm ${
                      fontStyle === 'serif' ? 'font-serif' : 
                      fontStyle === 'modern' ? 'font-mono text-xs' : 'font-sans'
                    }`}
                  >
                    {insight}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Footer with agent branding */}
          <div className="flex justify-between items-center mt-6 pt-3 border-t" style={{ borderColor: `${accentColor}30` }}>
            <span className={`text-xs opacity-70 ${
              fontStyle === 'serif' ? 'font-serif' : 
              fontStyle === 'modern' ? 'font-mono' : 'font-sans'
            }`}>
              {agentType === 'nuggets' ? 'Elias AI Nuggets' : 'Sonia AI Lightbulbs'}
            </span>
            <span className="text-xs opacity-70">
              Connected Mate
            </span>
          </div>
        </div>
      </div>
    );
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
      
      {/* Style customization */}
      <div className="customization-section bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
        <h4 className="text-md font-medium mb-4">Customize Appearance</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cover style selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Cover Style</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={config.visualStyle?.coverStyle || 'modern'}
              onChange={(e) => handleStyleChange('coverStyle', e.target.value)}
            >
              <option value="modern">Modern</option>
              <option value="vintage">Vintage</option>
              <option value="tech">Tech</option>
              <option value="artistic">Artistic</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>
          
          {/* Theme selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Interior Theme</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={config.visualStyle?.theme || 'modern'}
              onChange={(e) => handleStyleChange('theme', e.target.value)}
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="vintage">Vintage</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          
          {/* Font style selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Typography</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={config.visualStyle?.fontStyle || 'sans-serif'}
              onChange={(e) => handleStyleChange('fontStyle', e.target.value)}
            >
              <option value="sans-serif">Sans-serif (Modern)</option>
              <option value="serif">Serif (Traditional)</option>
              <option value="modern">Monospace (Technical)</option>
            </select>
          </div>
          
          {/* Color picker for accent color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Accent Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={config.visualStyle?.accentColor || agentColors.primary}
                onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              {/* Color presets */}
              <div className="flex gap-1 flex-wrap">
                {[
                  '#4f46e5', // indigo
                  '#0ea5e9', // sky
                  '#10b981', // emerald
                  '#f59e0b', // amber
                  '#ef4444', // red
                  '#8b5cf6', // violet
                  '#ec4899', // pink
                  '#171717'  // near black
                ].map(color => (
                  <button 
                    key={color}
                    onClick={() => handleStyleChange('accentColor', color)}
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                    aria-label={`Set accent color to ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Cover image generation */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="generateImages"
              checked={config.visualStyle?.generateImages || false}
              onChange={(e) => handleStyleChange('generateImages', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="generateImages" className="ml-2 block text-sm font-medium">
              Generate custom cover with DALL-E
            </label>
          </div>
          
          {config.visualStyle?.generateImages && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                Cover generation prompt (optional)
              </label>
              <textarea 
                value={config.visualStyle?.coverImagePrompt || ''}
                onChange={(e) => handleStyleChange('coverImagePrompt', e.target.value)}
                placeholder={`Generate a cover for ${agentType === 'nuggets' ? 'information insights' : 'innovative ideas'} from discussions...`}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to generate based on discussion insights automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBookPreview; 