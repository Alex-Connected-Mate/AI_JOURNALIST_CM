/**
 * Composant d'affichage de la progression des analyses
 * 
 * Ce composant affiche la progression des analyses en cours,
 * avec une barre de progression et des indicateurs visuels.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ANALYSIS_STATUS } from '@/lib/services/analysisService';
import logger from '@/lib/logger';

export default function AnalysisProgress({ sessionId, analysisType }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(ANALYSIS_STATUS.QUEUED);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Récupérer le statut initial
    const fetchInitialStatus = async () => {
      try {
        const { data: session, error } = await supabase
          .from('sessions')
          .select('analysis_status, analysis_progress')
          .eq('id', sessionId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (session) {
          setStatus(session.analysis_status || ANALYSIS_STATUS.QUEUED);
          setProgress(session.analysis_progress || 0);
        }
      } catch (error) {
        logger.error('Erreur lors de la récupération du statut initial:', error);
        setError('Impossible de récupérer l\'état de l\'analyse');
      }
    };
    
    fetchInitialStatus();
    
    // S'abonner aux mises à jour du statut d'analyse
    const subscription = supabase
      .channel(`session-analysis-${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        if (payload.new) {
          setStatus(payload.new.analysis_status || status);
          setProgress(payload.new.analysis_progress || progress);
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);
  
  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
        {error}
      </div>
    );
  }
  
  // Déterminer le message en fonction du statut
  let message = '';
  let icon = '';
  let progressBarColor = '';
  
  switch (status) {
    case ANALYSIS_STATUS.QUEUED:
      message = 'Analyse en attente de traitement...';
      icon = '⏳';
      progressBarColor = 'bg-yellow-500';
      break;
    case ANALYSIS_STATUS.PROCESSING:
      message = `Analyse en cours (${progress}%)...`;
      icon = '🔍';
      progressBarColor = 'bg-blue-500';
      break;
    case ANALYSIS_STATUS.COMPLETED:
      message = 'Analyse terminée avec succès!';
      icon = '✅';
      progressBarColor = 'bg-green-500';
      break;
    case ANALYSIS_STATUS.FAILED:
      message = 'L\'analyse a échoué. Veuillez réessayer.';
      icon = '❌';
      progressBarColor = 'bg-red-500';
      break;
    default:
      message = 'Statut inconnu';
      icon = '❓';
      progressBarColor = 'bg-gray-500';
  }
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white rounded-lg shadow-md p-6 mb-4"
      >
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{icon}</span>
          <h3 className="text-lg font-medium text-gray-800">
            {status === ANALYSIS_STATUS.PROCESSING ? `Analyse ${analysisType} en cours` : `Analyse ${analysisType}`}
          </h3>
        </div>
        
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <motion.div 
              className={`${progressBarColor} h-4 rounded-full`}
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{message}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        
        {status === ANALYSIS_STATUS.PROCESSING && (
          <div className="mt-4 text-sm text-gray-500 italic">
            Cette opération peut prendre quelques minutes en fonction de la taille des données à analyser.
          </div>
        )}
        
        {status === ANALYSIS_STATUS.FAILED && (
          <div className="mt-4 text-sm text-red-600">
            Erreur lors de l'analyse. Veuillez vérifier les paramètres et réessayer.
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
} 