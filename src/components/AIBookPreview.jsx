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
  
  // Add CSS animations for the enhanced themes
  const themeAnimations = `
    @keyframes pulse {
      0% { opacity: 0.3; }
      100% { opacity: 0.7; }
    }
    
    @keyframes retroScan {
      0% { transform: translateY(-100%) rotate(30deg); }
      100% { transform: translateY(100%) rotate(30deg); }
    }
    
    @keyframes dataStream {
      0% { background-position: 0 0; }
      100% { background-position: 0 100px; }
    }
    
    @keyframes blinkBorder {
      0% { border-color: rgba(100, 255, 218, 0.3); }
      50% { border-color: rgba(100, 255, 218, 0.8); }
      100% { border-color: rgba(100, 255, 218, 0.3); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-5px, 5px); }
      40% { transform: translate(-5px, -5px); }
      60% { transform: translate(5px, 5px); }
      80% { transform: translate(5px, -5px); }
      100% { transform: translate(0); }
    }
    
    @keyframes medievalFloat {
      0% { transform: translateY(0) rotate(0); }
      50% { transform: translateY(-5px) rotate(1deg); }
      100% { transform: translateY(0) rotate(0); }
    }
    
    .theme-retroPlus .book-cover::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: linear-gradient(to top, rgba(255, 41, 117, 0.3), transparent);
      z-index: -1;
    }
    
    .theme-aiFuture .book-cover {
      position: relative;
      overflow: hidden;
    }
    
    .theme-aiFuture .book-cover::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, transparent 30%, rgba(100, 255, 218, 0.1) 90%);
      animation: pulse 4s infinite alternate;
      z-index: 0;
    }
    
    .theme-developer .book-cover::after {
      content: '{ }';
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 24px;
      opacity: 0.5;
      color: #61afef;
      font-family: 'Fira Code', monospace;
    }
    
    .theme-medievalIntense .book-cover {
      animation: medievalFloat 5s ease-in-out infinite;
    }
  `;
  
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
        pattern: null,
        imageDesign: {
          withImage: {
            placeholder: "grid",
            style: "box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 0.5rem; background: linear-gradient(45deg, #f0f0f0 25%, #e0e0e0 25%, #e0e0e0 50%, #f0f0f0 50%, #f0f0f0 75%, #e0e0e0 75%, #e0e0e0 100%); background-size: 20px 20px;"
          },
          withoutImage: {
            design: "text-heavy",
            style: "font-size: 1.25rem; letter-spacing: -0.025em;"
          }
        }
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
        background: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/parchment-texture.jpg')", 
        textColor: "#3a2c1a",
        accentColor: "#8b4513",
        borderRadius: "0.25rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        fontFamily: "'Cinzel', serif",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/medieval-pattern.png')",
        imageDesign: {
          withImage: {
            placeholder: "framed-portrait",
            style: "border: 12px solid #8b4513; box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5); background: linear-gradient(45deg, #d2b48c 25%, #c19a6b 25%, #c19a6b 50%, #d2b48c 50%, #d2b48c 75%, #c19a6b 75%, #c19a6b 100%); background-size: 10px 10px;"
          },
          withoutImage: {
            design: "illuminated-manuscript",
            style: "font-family: 'Cinzel Decorative', cursive; text-transform: uppercase; letter-spacing: 0.1em;"
          }
        }
      },
      pageStyle: {
        background: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/parchment-texture-light.jpg')", 
        textColor: "#3a2c1a",
        accentColor: "#8b4513",
        borderRadius: "0.25rem",
        boxShadow: "0 6px 15px -3px rgba(0, 0, 0, 0.2)",
        fontFamily: "'EB Garamond', serif",
        bulletStyle: "medieval-fleuron",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/medieval-pattern.png')"
      }
    },
    futuristic: {
      name: "Futuristic",
      description: "Sci-fi inspired design with neon elements and glowing effects",
      coverStyle: {
        background: "linear-gradient(135deg, #000000 0%, #0a0a0a 100%)", 
        textColor: "#00ffff",
        accentColor: "#ff00ff",
        borderRadius: "0",
        boxShadow: "0 0 30px 5px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(255, 0, 255, 0.2)",
        fontFamily: "'Orbitron', sans-serif",
        pattern: "radial-gradient(circle, rgba(16,16,16,1) 0%, rgba(0,0,0,1) 100%)",
        imageDesign: {
          withImage: {
            placeholder: "hologram",
            style: "border: 2px solid #00ffff; box-shadow: 0 0 15px #00ffff; background: linear-gradient(45deg, rgba(0,0,0,0.7) 25%, rgba(20,20,20,0.7) 25%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.7) 75%, rgba(20,20,20,0.7) 75%, rgba(20,20,20,0.7) 100%); background-size: 4px 4px; animation: pulse 2s infinite alternate;"
          },
          withoutImage: {
            design: "cyber-terminal",
            style: "font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 0.2em; text-shadow: 0 0 10px #00ffff;"
          }
        }
      },
      pageStyle: {
        background: "#0a0a0a", 
        textColor: "#ffffff",
        accentColor: "#00ffff", 
        borderRadius: "0",
        boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
        fontFamily: "'Share Tech Mono', monospace",
        bulletStyle: "circuit",
        pattern: "linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)"
      }
    },
    nature: {
      name: "Natural",
      description: "Organic design inspired by natural elements",
      coverStyle: {
        background: "linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)", 
        textColor: "#ffffff",
        accentColor: "#d8f3dc",
        borderRadius: "1rem",
        boxShadow: "0 10px 25px -5px rgba(45, 106, 79, 0.4), 0 0 0 8px rgba(216, 243, 220, 0.2)",
        fontFamily: "'Quicksand', sans-serif",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/leaf-pattern.png')",
        imageDesign: {
          withImage: {
            placeholder: "organic-frame",
            style: "border: 8px solid #40916c; border-radius: 12px; background: repeating-linear-gradient(45deg, #d8f3dc, #d8f3dc 10px, #b7e4c7 10px, #b7e4c7 20px);"
          },
          withoutImage: {
            design: "vine-decorated",
            style: "font-family: 'Quicksand', sans-serif; background: url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/vine-decoration.png') no-repeat top center; background-size: 100% auto; padding-top: 60px;"
          }
        }
      },
      pageStyle: {
        background: "#f8fafc", 
        textColor: "#2d3b29",
        accentColor: "#588157",
        borderRadius: "1rem",
        boxShadow: "0 6px 15px -3px rgba(88, 129, 87, 0.1)",
        fontFamily: "'Quicksand', sans-serif",
        bulletStyle: "leaf",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/leaf-pattern-light.png')"
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
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(202, 138, 4, 0.3)",
        fontFamily: "'Playfair Display', serif",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/elegant-pattern.png')",
        imageDesign: {
          withImage: {
            placeholder: "gold-frame",
            style: "border: 6px solid #ca8a04; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5); background: repeating-linear-gradient(45deg, #1c1917, #1c1917 5px, #292524 5px, #292524 10px);"
          },
          withoutImage: {
            design: "gold-embossed",
            style: "font-family: 'Playfair Display', serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: linear-gradient(to bottom, #ffd700, #ca8a04); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
          }
        }
      },
      pageStyle: {
        background: "#ffffff", 
        textColor: "#1c1917",
        accentColor: "#ca8a04",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        fontFamily: "'Playfair Display', serif",
        bulletStyle: "diamond",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/elegant-pattern-light.png')"
      }
    },
    artistic: {
      name: "Artistic",
      description: "Creative, abstract design with vibrant colors and expressive typography",
      coverStyle: {
        background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", 
        textColor: "#ffffff",
        accentColor: "#fef08a",
        borderRadius: "1.5rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 10px rgba(254, 240, 138, 0.2)",
        fontFamily: "'Comfortaa', cursive",
        pattern: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)",
        imageDesign: {
          withImage: {
            placeholder: "paint-splash",
            style: "border-radius: 40% 5% 40% 5%; box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px #ec4899; background: radial-gradient(circle, #ec4899 0%, #6366f1 100%);"
          },
          withoutImage: {
            design: "brush-strokes",
            style: "font-family: 'Permanent Marker', cursive; background: url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/brush-strokes.png') no-repeat center; background-size: contain; padding: 30px;"
          }
        }
      },
      pageStyle: {
        background: "#ffffff", 
        textColor: "#18181b",
        accentColor: "#ec4899",
        borderRadius: "1rem",
        boxShadow: "10px 10px 0 -3px #6366f1",
        fontFamily: "'Quicksand', sans-serif",
        bulletStyle: "star",
        pattern: "linear-gradient(135deg, rgba(236, 72, 153, 0.03) 25%, transparent 25%, transparent 50%, rgba(236, 72, 153, 0.03) 50%, rgba(236, 72, 153, 0.03) 75%, transparent 75%, transparent)"
      }
    },
    retro: {
      name: "Retro",
      description: "Vintage design with nostalgic elements from the 80s and 90s",
      coverStyle: {
        background: "linear-gradient(0deg, #e9c46a 0%, #f4a261 50%, #e76f51 100%)", 
        textColor: "#264653",
        accentColor: "#2a9d8f",
        borderRadius: "0",
        boxShadow: "6px 6px 0 0 #264653",
        fontFamily: "'VT323', monospace",
        pattern: "repeating-linear-gradient(45deg, rgba(42, 157, 143, 0.2) 0%, rgba(42, 157, 143, 0.2) 2%, transparent 2%, transparent 4%)",
        imageDesign: {
          withImage: {
            placeholder: "tv-screen",
            style: "border: 8px solid #264653; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3); background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%, transparent 51%, rgba(0, 0, 0, 0.2) 51%, rgba(0, 0, 0, 0.2) 100%); background-size: 100% 4px;"
          },
          withoutImage: {
            design: "arcade-style",
            style: "font-family: 'Press Start 2P', cursive; color: #2a9d8f; text-shadow: 2px 2px 0 #264653; letter-spacing: 0.1em;"
          }
        }
      },
      pageStyle: {
        background: "#e9c46a", 
        textColor: "#264653",
        accentColor: "#2a9d8f",
        borderRadius: "0",
        boxShadow: "4px 4px 0 0 #264653",
        fontFamily: "'Space Mono', monospace",
        bulletStyle: "pixel",
        pattern: "radial-gradient(circle, rgba(42, 157, 143, 0.1) 10%, transparent 10%), radial-gradient(circle, rgba(42, 157, 143, 0.1) 10%, transparent 10%)"
      }
    },
    // New Themes
    retroPlus: {
      name: "Synthwave Retro",
      description: "Vibrant 80s Synthwave aesthetics with neon and retro-futuristic vibes",
      coverStyle: {
        background: "linear-gradient(180deg, #2b1055 0%, #7597de 100%)",
        textColor: "#ffffff",
        accentColor: "#ff00ff",
        borderRadius: "0",
        boxShadow: "0 0 40px rgba(255, 0, 255, 0.5), 0 25px 0 -10px #ff2975, 0 25px 0 -5px #5a0f78",
        fontFamily: "'Monoton', cursive",
        pattern: "repeating-linear-gradient(90deg, rgba(255, 0, 255, 0.3) 0px, rgba(255, 0, 255, 0.3) 1px, transparent 1px, transparent 15px), repeating-linear-gradient(0deg, rgba(255, 0, 255, 0.3) 0px, rgba(255, 0, 255, 0.3) 1px, transparent 1px, transparent 15px)",
        imageDesign: {
          withImage: {
            placeholder: "retro-grid",
            style: "border: 4px solid #ff2975; background: linear-gradient(0deg, #000, #000), linear-gradient(180deg, transparent 0%, #2b1055 100%); background-size: 100%, 100%; background-position: center, center; background-repeat: no-repeat, no-repeat; box-shadow: inset 0 0 30px rgba(255, 0, 255, 0.5); position: relative; overflow: hidden; z-index: 1; transform-style: preserve-3d; transform: perspective(500px) rotateX(10deg); &:before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(0deg, transparent 0%, transparent 20%, rgba(255, 41, 117, 0.8) 30%, transparent 100%); transform: rotate(30deg); animation: retroScan 4s linear infinite; z-index: -1; }"
          },
          withoutImage: {
            design: "neon-title",
            style: "font-family: 'Monoton', cursive; padding-top: 30px; text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff; letter-spacing: 0.1em; text-transform: uppercase; display: flex; justify-content: center; align-items: center; &:before { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to top, #ff2975 0%, transparent 100%); opacity: 0.3; }"
          }
        }
      },
      pageStyle: {
        background: "#150833",
        textColor: "#ffffff",
        accentColor: "#ff2975",
        borderRadius: "0",
        boxShadow: "10px 10px 0 0 #000, 15px 15px 0 0 #ff2975",
        fontFamily: "'Audiowide', cursive",
        bulletStyle: "circuit",
        pattern: "radial-gradient(circle at 50% 0%, rgba(255, 41, 117, 0.2) 0%, transparent 75%)"
      }
    },
    medievalIntense: {
      name: "Royal Antiquity",
      description: "Intensely detailed medieval design with gilded illuminations and gothic elements",
      coverStyle: {
        background: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/aged-parchment-dark.jpg')",
        textColor: "#2e1f1b",
        accentColor: "#a63c06",
        borderRadius: "0",
        boxShadow: "0 0 0 10px #4a2511, 0 0 0 14px #a63c06, 0 0 40px rgba(0, 0, 0, 0.5)",
        fontFamily: "'UnifrakturMaguntia', cursive",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/celtic-pattern.png')",
        imageDesign: {
          withImage: {
            placeholder: "illuminated-manuscript",
            style: "border: 15px solid #4a2511; position: relative; background: url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/aged-parchment-light.jpg'); box-shadow: inset 0 0 30px rgba(74, 37, 17, 0.8); &:before, &:after { content: ''; position: absolute; width: 30px; height: 30px; background: url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/illuminated-corner.png'); background-size: contain; } &:before { top: -8px; left: -8px; } &:after { top: -8px; right: -8px; transform: rotate(90deg); }"
          },
          withoutImage: {
            design: "royal-crest",
            style: "font-family: 'UnifrakturMaguntia', cursive; padding-top: 40px; color: #a63c06; text-align: center; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); &:before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 50px; height: 50px; background: url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/royal-crest.png') no-repeat center; background-size: contain; }"
          }
        }
      },
      pageStyle: {
        background: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/aged-parchment-light.jpg')",
        textColor: "#2e1f1b",
        accentColor: "#a63c06",
        borderRadius: "0",
        boxShadow: "0 0 0 1px #4a2511, 0 10px 20px rgba(0, 0, 0, 0.3)",
        fontFamily: "'Goudy Bookletter 1911', serif",
        bulletStyle: "fleur-de-lis",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/celtic-pattern-light.png')"
      }
    },
    aiFuture: {
      name: "Neural Network",
      description: "Hyper-futuristic AI visualization with neural patterns and data streams",
      coverStyle: {
        background: "linear-gradient(135deg, #050a30 0%, #000000 100%)",
        textColor: "#ffffff",
        accentColor: "#64ffda",
        borderRadius: "5px",
        boxShadow: "0 0 50px rgba(100, 255, 218, 0.3), inset 0 0 20px rgba(100, 255, 218, 0.1)",
        fontFamily: "'Exo 2', sans-serif",
        pattern: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/neural-pattern.png')",
        imageDesign: {
          withImage: {
            placeholder: "data-visualization",
            style: "border: 1px solid rgba(100, 255, 218, 0.5); position: relative; background: linear-gradient(to right, rgba(100, 255, 218, 0.05) 0%, rgba(100, 255, 218, 0.2) 50%, rgba(100, 255, 218, 0.05) 100%); &:before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(100, 255, 218, 0.2) 4px, rgba(100, 255, 218, 0.2) 5px); animation: dataStream 10s linear infinite; } &:after { content: ''; position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 1px dashed rgba(100, 255, 218, 0.5); opacity: 0.5; }"
          },
          withoutImage: {
            design: "neural-nodes",
            style: "font-family: 'Exo 2', sans-serif; position: relative; overflow: hidden; &:before { content: ''; position: absolute; width: 100%; height: 100%; background: url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/neural-nodes.png') no-repeat center; background-size: 90%; opacity: 0.3; animation: pulse 2s ease-in-out infinite alternate; }"
          }
        }
      },
      pageStyle: {
        background: "#000000",
        textColor: "#ffffff",
        accentColor: "#64ffda",
        borderRadius: "5px",
        boxShadow: "0 0 20px rgba(100, 255, 218, 0.15)",
        fontFamily: "'Exo 2', sans-serif",
        bulletStyle: "node",
        pattern: "linear-gradient(rgba(100, 255, 218, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 255, 218, 0.05) 1px, transparent 1px)",
      }
    },
    developer: {
      name: "Code Editor",
      description: "Developer-friendly design inspired by code editors and technical documents",
      coverStyle: {
        background: "#282c34",
        textColor: "#abb2bf",
        accentColor: "#61afef",
        borderRadius: "3px",
        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        fontFamily: "'Fira Code', monospace",
        pattern: null,
        imageDesign: {
          withImage: {
            placeholder: "code-window",
            style: "border: 1px solid #4b5263; background: #21252b; position: relative; font-family: 'Fira Code', monospace; &:before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 25px; background: #4b5263; border-bottom: 1px solid #4b5263; } &:after { content: ''; position: absolute; top: 7px; left: 10px; width: 12px; height: 12px; border-radius: 50%; background: #e06c75; box-shadow: 20px 0 0 #98c379, 40px 0 0 #e5c07b; }"
          },
          withoutImage: {
            design: "syntax-highlight",
            style: "font-family: 'Fira Code', monospace; position: relative; background: #282c34; &:before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 25px; background: #4b5263; }"
          }
        }
      },
      pageStyle: {
        background: "#282c34",
        textColor: "#abb2bf",
        accentColor: "#61afef",
        borderRadius: "3px",
        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        fontFamily: "'Fira Code', monospace",
        bulletStyle: "terminal",
        pattern: "linear-gradient(transparent 23px, rgba(97, 175, 239, 0.1) 23px, rgba(97, 175, 239, 0.1) 24px)"
      }
    },
    corporate: {
      name: "Executive Briefing",
      description: "Premium corporate style with professional and modern business aesthetics",
      coverStyle: {
        background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
        textColor: "#1a365d",
        accentColor: "#5a67d8",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(90, 103, 216, 0.1)",
        fontFamily: "'Montserrat', sans-serif",
        pattern: "repeating-linear-gradient(135deg, rgba(90, 103, 216, 0.02) 0px, rgba(90, 103, 216, 0.02) 1px, transparent 1px, transparent 50px)",
        imageDesign: {
          withImage: {
            placeholder: "data-chart",
            style: "border-radius: 8px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); background: white; position: relative; text-align: center; &:before { content: ''; position: absolute; left: 10%; right: 10%; bottom: 20%; height: 50%; background: repeating-linear-gradient(0deg, rgba(90, 103, 216, 0.1), rgba(90, 103, 216, 0.1) 5px, transparent 5px, transparent 12px); border-radius: 5px; }"
          },
          withoutImage: {
            design: "executive-summary",
            style: "font-family: 'Montserrat', sans-serif; padding-top: 20px; position: relative; display: flex; align-items: center; justify-content: center; &:before { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 70%; height: 40%; border: 2px solid rgba(90, 103, 216, 0.15); border-radius: 30px; }"
          }
        }
      },
      pageStyle: {
        background: "#ffffff",
        textColor: "#1a365d",
        accentColor: "#5a67d8",
        borderRadius: "10px",
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
        fontFamily: "'Montserrat', sans-serif",
        bulletStyle: "checkmark",
        pattern: "repeating-linear-gradient(135deg, rgba(90, 103, 216, 0.02) 0px, rgba(90, 103, 216, 0.02) 1px, transparent 1px, transparent 50px)"
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
    const generateImages = config.visualStyle?.generateImages ?? false; // Default to false as requested
    
    return (
      <div 
        className={`book-cover theme-${currentThemeName} relative overflow-hidden rounded-lg shadow-xl`}
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
        
        {/* Dynamic cover content based on whether images are enabled */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          {/* Custom image placeholder if images are enabled */}
          {generateImages ? (
            <div className="w-full h-40 mb-4" style={{ 
              ...(theme.imageDesign?.withImage?.style && { cssText: theme.imageDesign.withImage.style }) 
            }}>
              <div className="text-center p-2 h-full flex items-center justify-center">
                <div className="text-xs mb-1" style={{ color: theme.accentColor }}>
                  Image will be generated based on insights
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 mb-4 flex items-center justify-center" style={{
              ...(theme.imageDesign?.withoutImage?.style && { cssText: theme.imageDesign.withoutImage.style })
            }}>
              {/* Extra decorative elements or alternative layout for image-less design */}
            </div>
          )}
          
          {/* Title area */}
          <div className="text-center mb-4">
            <h2 
              className="text-2xl font-bold mb-1"
              style={{ color: theme.accentColor }}
            >
              {agentType === 'nuggets' ? 'Key Insights' : 'Creative Ideas'}
            </h2>
            <p className="text-sm opacity-90">
              {agentType === 'nuggets' 
                ? 'Valuable information extracted from your discussions' 
                : 'Innovative concepts developed from your discussions'}
            </p>
          </div>
          
          {/* Author area */}
          {showParticipantName && (
            <div className="text-center mt-auto">
              <p className="text-sm opacity-80">Prepared for</p>
              <p 
                className="font-semibold"
                style={{ color: theme.accentColor }}
              >
                {participantName}
              </p>
            </div>
          )}
          
          {/* Add extra decorative elements based on theme */}
          {currentThemeName === 'medieval' && (
            <div className="absolute top-2 left-2 right-2 h-8" style={{ 
              borderTop: `2px solid ${theme.accentColor}`,
              borderBottom: `2px solid ${theme.accentColor}`,
              opacity: 0.7
            }}></div>
          )}
          
          {currentThemeName === 'futuristic' && (
            <div className="absolute bottom-3 left-6 right-6 h-1" style={{ 
              background: `linear-gradient(to right, transparent, ${theme.accentColor}, transparent)`,
              boxShadow: `0 0 10px ${theme.accentColor}`,
              opacity: 0.8
            }}></div>
          )}
          
          {currentThemeName === 'artistic' && (
            <div className="absolute top-0 right-0 w-20 h-20" style={{ 
              background: `radial-gradient(circle, ${theme.accentColor}80 0%, transparent 70%)`,
              opacity: 0.6
            }}></div>
          )}
          
          {currentThemeName === 'retro' && (
            <div className="absolute top-3 left-3 right-3 text-center" style={{ 
              fontFamily: "'VT323', monospace",
              color: theme.accentColor,
              textShadow: `1px 1px 0 ${theme.textColor}`
            }}>
              VOL. 01
            </div>
          )}
          
          {currentThemeName === 'retroPlus' && (
            <div className="absolute top-3 left-3 right-3 text-center" style={{ 
              fontFamily: "'Monoton', cursive",
              color: theme.accentColor,
              fontSize: '10px',
              letterSpacing: '0.3em',
              textShadow: `0 0 10px ${theme.accentColor}`
            }}>
              SYNTHWAVE EDITION
            </div>
          )}
          
          {currentThemeName === 'aiFuture' && (
            <div className="absolute bottom-4 left-0 right-0 text-center" style={{ 
              fontFamily: "'Exo 2', sans-serif",
              color: theme.accentColor,
              fontSize: '8px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase'
            }}>
              {Array.from({ length: 20 }, (_, i) => 
                <span key={i} style={{ opacity: Math.random() * 0.5 + 0.5 }}>
                  {Math.random() > 0.5 ? '1' : '0'}
                </span>
              )}
            </div>
          )}
          
          {currentThemeName === 'medievalIntense' && (
            <div className="absolute top-3 left-0 right-0 flex justify-center" style={{ 
              opacity: 0.8
            }}>
              <div style={{ 
                width: '80px', 
                height: '40px', 
                backgroundImage: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/medieval-ornament.png')",
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}></div>
            </div>
          )}
          
          {currentThemeName === 'developer' && (
            <div className="absolute top-2 left-4 right-4 text-xs" style={{ 
              fontFamily: "'Fira Code', monospace",
              color: theme.accentColor,
              opacity: 0.7
            }}>
              book.insights.js
            </div>
          )}
          
          {currentThemeName === 'corporate' && (
            <div className="absolute top-2 right-2 flex items-center justify-center" style={{ 
              width: '40px',
              height: '40px',
              background: theme.accentColor,
              borderRadius: '50%',
              opacity: 0.9
            }}>
              <div style={{ 
                color: 'white', 
                fontSize: '22px', 
                fontWeight: 'bold',
                fontFamily: "'Montserrat', sans-serif"
              }}>C</div>
            </div>
          )}
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
    
    // Image placeholder styling - only shown if generateImages is true
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
        className={`book-page theme-${currentThemeName} relative overflow-hidden rounded-lg shadow-lg`}
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
        
        {/* Custom theme decorations */}
        {currentThemeName === 'retroPlus' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-20" 
                style={{ 
                  background: 'linear-gradient(to top, rgba(255, 41, 117, 0.2), transparent)',
                  zIndex: 1 
                }}>
            </div>
            <div className="absolute top-2 left-2 text-xs" 
                style={{ 
                  fontFamily: "'VT323', monospace",
                  color: '#ff2975',
                  opacity: 0.7,
                  zIndex: 1
                }}>
              // SYNTHWAVE_DATA
            </div>
          </div>
        )}

        {currentThemeName === 'medievalIntense' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-10" 
                style={{ 
                  borderBottom: '2px solid rgba(166, 60, 6, 0.3)',
                  backgroundImage: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/medieval-border-top.png')",
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: 'auto 10px',
                  backgroundPosition: 'center bottom',
                  opacity: 0.5,
                  zIndex: 1
                }}>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10"
                style={{ 
                  borderTop: '2px solid rgba(166, 60, 6, 0.3)',
                  backgroundImage: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/medieval-border-bottom.png')",
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: 'auto 10px',
                  backgroundPosition: 'center top',
                  opacity: 0.5,
                  zIndex: 1
                }}>
            </div>
          </div>
        )}

        {currentThemeName === 'aiFuture' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 h-6 w-6" 
                style={{ 
                  border: '1px solid rgba(100, 255, 218, 0.5)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite alternate',
                  zIndex: 1
                }}>
            </div>
            <div className="absolute bottom-4 left-4 text-xs" 
                style={{ 
                  fontFamily: "'Exo 2', sans-serif",
                  color: 'rgba(100, 255, 218, 0.5)',
                  zIndex: 1
                }}>
              AI.SYSTEM.v7.3
            </div>
          </div>
        )}

        {currentThemeName === 'developer' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-6" 
                style={{ 
                  background: '#21252b',
                  borderBottom: '1px solid #4b5263',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontSize: '10px',
                  fontFamily: "'Fira Code', monospace",
                  color: '#abb2bf',
                  zIndex: 1
                }}>
              <span style={{ marginRight: '8px', color: '#e06c75' }}>●</span>
              <span style={{ marginRight: '8px', color: '#98c379' }}>●</span>
              <span style={{ marginRight: '12px', color: '#e5c07b' }}>●</span>
              <span>insights.jsx</span>
            </div>
            <div className="absolute top-6 left-0 bottom-0 w-6" 
                style={{ 
                  borderRight: '1px solid rgba(97, 175, 239, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 0',
                  fontSize: '10px',
                  color: '#636d83',
                  zIndex: 1
                }}>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>{i + 1}</div>
              ))}
            </div>
          </div>
        )}

        {currentThemeName === 'corporate' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2" 
                style={{ 
                  width: '30px',
                  height: '30px',
                  backgroundImage: "url('https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent/corporate-logo.png')",
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  opacity: 0.1,
                  zIndex: 1
                }}>
            </div>
            <div className="absolute bottom-2 left-0 right-0 h-1" 
                style={{ 
                  background: `linear-gradient(to right, transparent, ${theme.accentColor}30, transparent)`,
                  zIndex: 1
                }}>
            </div>
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
          <div className="flex-1">
            <ul className="space-y-2">
              {pageInsights.map((insight, i) => (
                <li key={i} className="flex items-start">
                  <span 
                    className="flex-shrink-0 mr-2 mt-1"
                    style={{ color: theme.accentColor }}
                  >
                    {getBulletPoint(theme.bulletStyle)}
                  </span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Footer with attribution if showing participant name */}
          {showParticipantName && (
            <div className="mt-6 text-xs opacity-70 text-right">
              <p>From {participantName}'s session</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Function to get appropriate bullet point based on style
  const getBulletPoint = (style) => {
    const bulletStyles = {
      'circle': '•',
      'diamond': '◆',
      'arrow': '→',
      'star': '★',
      'leaf': '☘️',
      'medieval-fleuron': '❧',
      'fleur-de-lis': '⚜',
      'circuit': '⦿',
      'pixel': '█',
      'node': '◉',
      'terminal': '>',
      'checkmark': '✓'
    };
    
    return bulletStyles[style] || bulletStyles.circle;
  };

  // Toggle between cover and page view
  const toggleView = () => {
    setShowCover(!showCover);
    // Reset to first page when returning to pages
    if (showCover) {
      setPreviewPage(0);
    }
  };
  
  return (
    <div className="book-preview space-y-8">
      {/* Add the CSS styles for animations */}
      <style dangerouslySetInnerHTML={{ __html: themeAnimations }} />
      
      {/* View toggle */}
      <div className="flex justify-center mb-2">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setShowCover(true)}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              showCover 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cover
          </button>
          <button
            onClick={() => setShowCover(false)}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              !showCover 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pages
          </button>
        </div>
      </div>
      
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
                  checked={config.visualStyle?.generateImages ?? false}
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