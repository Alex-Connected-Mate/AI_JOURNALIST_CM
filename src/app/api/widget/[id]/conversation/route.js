import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * POST /api/widget/[id]/conversation
 * 
 * Initialise une nouvelle conversation avec un agent à partir de son ID
 * 
 * @param {Object} request - La requête HTTP
 * @param {Object} params - Les paramètres de la route
 * @param {string} params.id - L'ID de l'agent
 */
export async function POST(request, { params }) {
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
    // Récupérer les données du corps de la requête
    const requestData = await request.json();
    const { visitorId } = requestData;
    
    if (!visitorId) {
      return NextResponse.json(
        { error: 'Visitor ID is required' },
        { status: 400 }
      );
    }
    
    // Créer un client Supabase basé sur les cookies
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérifier si l'origine est autorisée en vérifiant la configuration du widget
    if (process.env.NODE_ENV !== 'development') {
      const { data: widgetConfig } = await supabase
        .from('widget_configurations')
        .select('allowed_domains')
        .eq('agent_id', agentId)
        .single();
        
      if (widgetConfig?.allowed_domains && Array.isArray(widgetConfig.allowed_domains)) {
        if (!widgetConfig.allowed_domains.includes('*') && !widgetConfig.allowed_domains.includes(origin)) {
          console.warn(`Unauthorized conversation attempt from origin: ${origin}`);
          return NextResponse.json(
            { error: 'Unauthorized origin' },
            { status: 403 }
          );
        }
      }
    }
    
    // Vérifier que l'agent existe
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
    
    // Générer un numéro de téléphone "fictif" pour le widget basé sur le visitorId
    // Puisque la table conversations utilise contact_phone, nous créons un format
    // qui est clairement identifiable comme un contact de widget
    const contactPhone = `widget_${visitorId.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Vérifier si une conversation existe déjà
    const { data: existingConversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('agent_id', agentId)
      .eq('contact_phone', contactPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let conversationId;
    
    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error('Error checking existing conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to check existing conversations' },
        { status: 500 }
      );
    }
    
    // Si une conversation existe, utilisez-la
    if (existingConversation) {
      conversationId = existingConversation.id;
      
      // Mettre à jour last_activity
      await supabase
        .from('conversations')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      // Créer une nouvelle conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          contact_phone: contactPhone,
          last_activity: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating conversation:', createError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }
      
      conversationId = newConversation.id;
      
      // Récupérer la configuration du widget pour le message initial
      const { data: widgetConfig } = await supabase
        .from('widget_configurations')
        .select('chat_bubble_text')
        .eq('agent_id', agentId)
        .single();
      
      // Créer un message initial d'agent
      const welcomeMessage = widgetConfig?.chat_bubble_text || 'Bonjour ! Comment puis-je vous aider ?';
      
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'agent',
          content: welcomeMessage
        });
    }
    
    // Récupérer les messages de la conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }
    
    // Transformer les messages pour les adapter au format attendu par le widget
    const formattedMessages = messages.map(message => ({
      id: message.id,
      sender: message.role === 'user' ? 'human' : 'ai',
      content: message.content,
      timestamp: message.created_at
    }));
    
    // Définir les en-têtes CORS
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type');
    
    // Retourner les données de la conversation
    return NextResponse.json({
      conversationId,
      messages: formattedMessages
    }, {
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

// Gérer les requêtes OPTIONS pour le CORS
export async function OPTIONS() {
  const headers = new Headers();
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.append('Access-Control-Allow-Headers', 'Content-Type');
  
  return new Response(null, {
    status: 204,
    headers
  });
} 