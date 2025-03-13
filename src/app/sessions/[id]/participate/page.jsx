'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ParticipateSessionPage({ params }) {
  const sessionId = params.id;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Vérifier l'accès et charger les données
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId || !token) {
        setError('Informations de session manquantes');
        setLoading(false);
        return;
      }
      
      try {
        // 1. Récupérer l'ID du participant depuis localStorage
        const participantId = localStorage.getItem('anonymousParticipantId');
        
        if (!participantId) {
          setError('Session expirée ou invalide');
          setLoading(false);
          return;
        }
        
        // 2. Vérifier que le token est valide
        const { data: validToken, error: tokenError } = await supabase.rpc(
          'verify_anonymous_participant',
          { p_participant_id: participantId, p_token: token }
        );
        
        if (tokenError || !validToken) {
          setError('Token invalide ou expiré');
          setLoading(false);
          return;
        }
        
        // 3. Charger les données de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('status', 'active')
          .single();
        
        if (sessionError || !sessionData) {
          setError('Session introuvable ou inactive');
          setLoading(false);
          return;
        }
        
        // 4. Charger les données du participant
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('id', participantId)
          .single();
        
        if (participantError || !participantData) {
          setError('Données participant introuvables');
          setLoading(false);
          return;
        }
        
        setSession(sessionData);
        setParticipant(participantData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Une erreur est survenue lors du chargement de la session');
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, token]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/join" 
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Rejoindre une autre session
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{session?.name || 'Session'}</h1>
          <p className="text-gray-600">
            {session?.description || 'Aucune description'}
          </p>
          <div className="mt-2 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded inline-block">
            Connecté en tant que: {participant?.display_name || 'Participant anonyme'}
          </div>
        </div>
        
        {/* Ici insérer les composants pour la participation à la session */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-center text-gray-600">
            La session est en cours. Attendez les instructions du professeur.
          </p>
        </div>
      </div>
    </div>
  );
} 