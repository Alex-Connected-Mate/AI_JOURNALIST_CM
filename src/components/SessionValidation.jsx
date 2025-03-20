import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { useSessionConfigStore } from '@/lib/store/sessionConfigStore';
import { sessionConfigService } from '@/lib/services/sessionConfigService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const SessionValidation = ({ onSuccess }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  
  // Récupérer la configuration temporaire
  const { tempConfig, validateConfig, resetConfig } = useSessionConfigStore();
  
  // Valider et sauvegarder la configuration
  const handleValidation = async () => {
    setIsValidating(true);
    
    try {
      // Vérifier que la configuration est valide
      if (!validateConfig()) {
        toast({
          title: "Configuration invalide",
          description: "Veuillez vérifier que tous les champs requis sont remplis.",
          variant: "destructive",
        });
        return;
      }
      
      // Sauvegarder dans Supabase
      await sessionConfigService.saveConfig(tempConfig.session_id, tempConfig);
      
      // Réinitialiser le store
      resetConfig();
      
      toast({
        title: "Session créée",
        description: "La session a été créée avec succès.",
        variant: "default",
      });
      
      // Callback de succès
      if (onSuccess) {
        onSuccess(tempConfig);
      }
      
    } catch (error) {
      console.error('Error validating session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <h3 className="text-lg font-medium text-blue-800">Validation de la session</h3>
          <p className="mt-2 text-sm text-blue-700">
            Vérifiez que tous les paramètres sont corrects avant de créer la session.
            Une fois validée, la session sera sauvegardée et pourra être lancée.
          </p>
        </div>
        
        {/* Résumé de la configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Résumé de la configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700">Informations générales</h5>
              <ul className="mt-2 space-y-2 text-sm">
                <li>Titre: {tempConfig?.title || 'Non défini'}</li>
                <li>Formateur: {tempConfig?.teacherName || 'Non défini'}</li>
                <li>Contexte: {tempConfig?.programContext || 'Non défini'}</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700">Configuration AI</h5>
              <ul className="mt-2 space-y-2 text-sm">
                <li>Agent Nuggets: {tempConfig?.settings?.ai_configuration?.nuggets?.agentName || 'Non configuré'}</li>
                <li>Agent Lightbulbs: {tempConfig?.settings?.ai_configuration?.lightbulbs?.agentName || 'Non configuré'}</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isValidating}
          >
            Retour
          </Button>
          
          <Button
            onClick={handleValidation}
            disabled={isValidating}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            {isValidating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validation en cours...
              </>
            ) : (
              'Valider et créer la session'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SessionValidation; 