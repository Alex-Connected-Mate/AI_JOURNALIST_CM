import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * POST /api/widget/[id]/message
 * 
 * Envoie un message à l'agent et récupère sa réponse
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
    const { conversationId, visitorId, content } = requestData;
    
    // Vérifier que tous les champs requis sont présents
    if (!conversationId || !visitorId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID, visitor ID, and content are required' },
        { status: 400 }
      );
    }
    
    // Créer un client Supabase basé sur les cookies
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérifier si l'origine est autorisée
    if (process.env.NODE_ENV !== 'development') {
      const { data: widgetConfig } = await supabase
        .from('widget_configurations')
        .select('allowed_domains, is_active')
        .eq('agent_id', agentId)
        .single();
        
      // Vérifier si le widget est actif
      if (widgetConfig && !widgetConfig.is_active) {
        return NextResponse.json(
          { error: 'This widget is currently inactive' },
          { status: 403 }
        );
      }
      
      // Vérifier l'origine
      if (widgetConfig?.allowed_domains && Array.isArray(widgetConfig.allowed_domains)) {
        if (!widgetConfig.allowed_domains.includes('*') && !widgetConfig.allowed_domains.includes(origin)) {
          console.warn(`Unauthorized message attempt from origin: ${origin}`);
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
      .select('id, name, user_id, prompt_generated, prompt_custom, agent_behavior')
      .eq('id', agentId)
      .single();
    
    if (agentError) {
      console.error('Error fetching agent:', agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Vérifier que la conversation existe et appartient à cet agent
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, agent_id, user_id')
      .eq('id', conversationId)
      .eq('agent_id', agentId)
      .single();
    
    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Vérifier que le message n'est pas trop long (prévention des abus)
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message content too long (max: 2000 characters)' },
        { status: 400 }
      );
    }
    
    // Enregistrer le message de l'utilisateur
    const { data: userMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content
      })
      .select()
      .single();
    
    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return NextResponse.json(
        { error: 'Failed to save user message' },
        { status: 500 }
      );
    }
    
    // Mettre à jour last_activity de la conversation
    await supabase
      .from('conversations')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', conversationId);
      
    // Récupérer l'historique des messages pour le contexte
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);  // Limiter à 20 messages pour éviter de dépasser le contexte maximal
    
    if (historyError) {
      console.error('Error fetching message history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch message history' },
        { status: 500 }
      );
    }
    
    // Récupérer la clé OpenAI de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('openai_key')
      .eq('id', agent.user_id)
      .single();
    
    if (profileError || !profile.openai_key) {
      console.error('Error fetching OpenAI key:', profileError);
      
      // Enregistrer un message d'erreur
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'agent',
          content: "Je suis désolé, je rencontre un problème technique. L'administrateur doit configurer sa clé API OpenAI."
        });
      
      return NextResponse.json(
        { error: 'OpenAI API key not found' },
        { status: 500 }
      );
    }
    
    // Préparer le contexte pour OpenAI
    const messages = messageHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Ajouter un message système avec le prompt de l'agent
    const systemPrompt = agent.prompt_custom || agent.prompt_generated || 'You are a helpful assistant.';
    messages.unshift({
      role: 'system',
      content: systemPrompt
    });
    
    // Appeler l'API OpenAI
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.openai_key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      // Vérifier si la réponse est OK
      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error:', errorData);
        
        // Enregistrer un message d'erreur
        const { data: errorMessage } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'agent',
            content: "Je suis désolé, je rencontre des difficultés à traiter votre demande. Veuillez réessayer plus tard."
          })
          .select()
          .single();
          
        // Renvoyer l'erreur formatée pour le widget
        const formattedErrorMessage = {
          id: errorMessage.id,
          sender: 'ai',
          content: errorMessage.content,
          timestamp: errorMessage.created_at
        };
        
        // Définir les en-têtes CORS
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
        headers.append('Access-Control-Allow-Headers', 'Content-Type');
        
        return NextResponse.json({ 
          message: formattedErrorMessage,
          error: 'OpenAI API error: ' + (errorData.error?.message || 'Unknown error')
        }, {
          status: 200, // On renvoie 200 pour que le widget puisse afficher le message d'erreur
          headers
        });
      }
      
      const openaiData = await openaiResponse.json();
      const aiResponseContent = openaiData.choices[0].message.content;
      
      // Enregistrer la réponse de l'IA
      const { data: aiMessage, error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'agent',
          content: aiResponseContent
        })
        .select()
        .single();
      
      if (aiMessageError) {
        console.error('Error saving AI response:', aiMessageError);
        return NextResponse.json(
          { error: 'Failed to save AI response' },
          { status: 500 }
        );
      }
      
      // Transformer le message pour le format attendu par le widget
      const formattedMessage = {
        id: aiMessage.id,
        sender: 'ai',
        content: aiMessage.content,
        timestamp: aiMessage.created_at
      };
      
      // Définir les en-têtes CORS
      const headers = new Headers();
      headers.append('Access-Control-Allow-Origin', '*');
      headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
      headers.append('Access-Control-Allow-Headers', 'Content-Type');
      
      // Retourner la réponse
      return NextResponse.json({
        message: formattedMessage
      }, {
        status: 200,
        headers
      });
      
    } catch (openAiError) {
      console.error('Error calling OpenAI:', openAiError);
      
      // Enregistrer un message d'erreur
      const { data: errorMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'agent',
          content: "Je suis désolé, je rencontre des difficultés à traiter votre demande. Veuillez réessayer plus tard."
        })
        .select()
        .single();
      
      // Formater le message d'erreur pour le widget
      const formattedErrorMessage = {
        id: errorMessage.id,
        sender: 'ai',
        content: errorMessage.content,
        timestamp: errorMessage.created_at
      };
      
      // Définir les en-têtes CORS
      const headers = new Headers();
      headers.append('Access-Control-Allow-Origin', '*');
      headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
      headers.append('Access-Control-Allow-Headers', 'Content-Type');
      
      return NextResponse.json({ 
        message: formattedErrorMessage,
        error: 'Failed to get AI response: ' + openAiError.message 
      }, {
        status: 200, // On renvoie 200 pour que le widget puisse afficher le message d'erreur
        headers
      });
    }
    
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