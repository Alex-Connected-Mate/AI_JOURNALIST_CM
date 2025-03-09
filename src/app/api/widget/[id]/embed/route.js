import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/widget/[id]/embed
 * 
 * Génère le script d'intégration pour le widget
 * 
 * @param {Object} request - La requête HTTP
 * @param {Object} params - Les paramètres de la route
 * @param {string} params.id - L'ID de l'agent
 */
export async function GET(request, { params }) {
  const agentId = params.id;
  
  // Vérifier que l'ID de l'agent est fourni
  if (!agentId) {
    return NextResponse.json(
      { error: 'Agent ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Créer un client Supabase basé sur les cookies
    const supabase = createRouteHandlerClient({ cookies });
    
    // Récupérer la configuration du widget et les informations de l'agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, user_id')
      .eq('id', agentId)
      .single();
    
    if (agentError) {
      console.error('Error fetching agent:', agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Récupérer la configuration du widget
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('widget_configurations')
      .select('*')
      .eq('agent_id', agentId)
      .single();
    
    // Si aucune configuration trouvée, on peut continuer avec les valeurs par défaut
    
    // Déterminer l'URL de base
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Récupérer les paramètres de configuration
    const widgetPosition = widgetConfig?.widget_position || 'bottom-right';
    const primaryColor = widgetConfig?.primary_color || '#007AFF';
    
    // Générer le script d'intégration
    const script = `
      (function() {
        // Configuration
        const agentId = "${agentId}";
        const baseUrl = "${baseUrl}";
        const position = "${widgetPosition}";
        const primaryColor = "${primaryColor}";
        
        // Créer le bouton du widget
        function createWidgetButton() {
          const button = document.createElement('div');
          button.id = 'cm-widget-button';
          button.innerHTML = \`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-7.152.52c-2.43 0-4.817-.178-7.152-.52C2.87 16.46 1.5 14.728 1.5 12.782V6.76c0-1.946 1.37-3.68 3.348-3.989zM21.75 17.25a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h18a.75.75 0 01.75.75zM9 13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clip-rule="evenodd" />
            </svg>
          \`;
          
          // Appliquer les styles
          Object.assign(button.style, {
            position: 'fixed',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: primaryColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            zIndex: '9999',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          });
          
          // Positionner le bouton
          if (position === 'bottom-right') {
            Object.assign(button.style, {
              bottom: '20px',
              right: '20px'
            });
          } else if (position === 'bottom-left') {
            Object.assign(button.style, {
              bottom: '20px',
              left: '20px'
            });
          } else if (position === 'top-right') {
            Object.assign(button.style, {
              top: '20px',
              right: '20px'
            });
          } else if (position === 'top-left') {
            Object.assign(button.style, {
              top: '20px',
              left: '20px'
            });
          }
          
          // Effets de survol
          button.onmouseover = function() {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
          };
          
          button.onmouseout = function() {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          };
          
          // Ouvrir le widget au clic
          button.onclick = function() {
            openWidget();
            button.style.display = 'none';
          };
          
          return button;
        }
        
        // Créer la fenêtre du widget
        function createWidgetWindow() {
          const container = document.createElement('div');
          container.id = 'cm-widget-container';
          
          // Appliquer les styles
          Object.assign(container.style, {
            position: 'fixed',
            width: '350px',
            height: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: '10000',
            overflow: 'hidden',
            display: 'none'
          });
          
          // Positionner la fenêtre
          if (position === 'bottom-right') {
            Object.assign(container.style, {
              bottom: '20px',
              right: '20px'
            });
          } else if (position === 'bottom-left') {
            Object.assign(container.style, {
              bottom: '20px',
              left: '20px'
            });
          } else if (position === 'top-right') {
            Object.assign(container.style, {
              top: '20px',
              right: '20px'
            });
          } else if (position === 'top-left') {
            Object.assign(container.style, {
              top: '20px',
              left: '20px'
            });
          }
          
          // Ajouter l'iframe
          const iframe = document.createElement('iframe');
          iframe.src = \`\${baseUrl}/widget/\${agentId}\`;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          
          container.appendChild(iframe);
          
          return container;
        }
        
        // Fonction pour ouvrir le widget
        function openWidget() {
          const container = document.getElementById('cm-widget-container');
          if (container) {
            container.style.display = 'block';
          }
        }
        
        // Fonction pour fermer le widget
        function closeWidget() {
          const container = document.getElementById('cm-widget-container');
          const button = document.getElementById('cm-widget-button');
          
          if (container) {
            container.style.display = 'none';
          }
          
          if (button) {
            button.style.display = 'flex';
          }
        }
        
        // Ajouter les éléments au DOM
        document.addEventListener('DOMContentLoaded', function() {
          const button = createWidgetButton();
          const container = createWidgetWindow();
          
          document.body.appendChild(button);
          document.body.appendChild(container);
          
          // Écouter les messages de l'iframe
          window.addEventListener('message', function(event) {
            if (event.data === 'close-widget') {
              closeWidget();
            }
          });
        });
      })();
    `;
    
    // Définir les headers pour le JavaScript
    const headers = new Headers();
    headers.set('Content-Type', 'application/javascript');
    headers.set('Cache-Control', 'max-age=3600, s-maxage=3600, stale-while-revalidate');
    
    // Retourner le script
    return new Response(script, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 