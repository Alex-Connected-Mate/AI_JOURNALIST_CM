import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/widget/[id]/config
 * 
 * Récupère la configuration d'un widget à partir de son ID d'agent
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
  
  // Obtenir l'origine de la requête
  const origin = request.headers.get('origin') || '';
  
  try {
    // Créer un client Supabase basé sur les cookies
    const supabase = createRouteHandlerClient({ cookies });
    
    // Récupérer la configuration du widget et les informations de l'agent
    const { data: widgetConfig, error: widgetError } = await supabase
      .from('widget_configurations')
      .select('*')
      .eq('agent_id', agentId)
      .single();
    
    // Si une erreur se produit lors de la récupération de la configuration du widget
    if (widgetError) {
      console.error('Error fetching widget config:', widgetError);
      
      // Si la config n'existe pas, vérifier quand même que l'agent existe
      if (widgetError.code === 'PGRST116') {
        // Vérifier d'abord que l'agent existe
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('id, name, user_id')
          .eq('id', agentId)
          .single();
          
        if (agentError) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 }
          );
        }
        
        // Retourner une configuration par défaut
        return NextResponse.json({
          agent_id: agentId,
          agent_name: agent.name,
          primary_color: '#007AFF',
          secondary_color: '#FFFFFF',
          widget_position: 'bottom-right',
          widget_size: 'medium',
          chat_bubble_text: 'Comment puis-je vous aider ?',
          is_active: true
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch widget configuration' },
        { status: 500 }
      );
    }
    
    // Vérifier si l'origine est autorisée (sauf en développement)
    if (process.env.NODE_ENV !== 'development') {
      // Si le widget a des domaines autorisés définis
      if (widgetConfig.allowed_domains && Array.isArray(widgetConfig.allowed_domains)) {
        // Si le tableau de domaines ne contient pas * et ne contient pas l'origine actuelle
        if (!widgetConfig.allowed_domains.includes('*') && !widgetConfig.allowed_domains.includes(origin)) {
          console.warn(`Unauthorized access attempt from origin: ${origin}`);
          return NextResponse.json(
            { error: 'Unauthorized origin' },
            { status: 403 }
          );
        }
      }
    }
    
    // Récupérer les informations de l'agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, user_id')
      .eq('id', agentId)
      .single();
    
    if (agentError) {
      console.error('Error fetching agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to fetch agent information' },
        { status: 500 }
      );
    }
    
    // Récupérer les URLs publiques des images si elles existent
    const widgetData = {
      ...widgetConfig,
      agent_name: agent.name
    };
    
    // Définir les en-têtes CORS pour permettre l'accès depuis différentes origines
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type');
    
    // Retourner la configuration du widget
    return NextResponse.json(widgetData, { 
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 