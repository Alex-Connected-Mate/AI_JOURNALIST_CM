import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/contexts/SessionContext';
import AIPromptManager from '@/components/AIPromptManager';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AIAgentService from '@/components/AIAgentService';

/**
 * Workshop Agents Configuration Page
 * 
 * This page allows admins to configure the AI agents for a specific workshop.
 */
export default function WorkshopAgentsPage() {
  const router = useRouter();
  const { id: workshopId } = router.query;
  const { session } = useSession();
  
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Load workshop data
  useEffect(() => {
    const fetchWorkshop = async () => {
      if (!workshopId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('workshops')
          .select('*')
          .eq('id', workshopId)
          .single();
        
        if (error) throw error;
        
        setWorkshop(data);
      } catch (error) {
        console.error('Error fetching workshop:', error);
        setError('Failed to load workshop details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkshop();
  }, [workshopId]);
  
  // Handle prompt save and assistant creation
  const handlePromptSaveComplete = async (agentType, config) => {
    try {
      setSuccessMessage(`${agentType === 'nuggets' ? 'Elias' : 'Sonia'} prompt saved successfully. Creating agent...`);
      
      // Create or update the OpenAI assistant
      await AIAgentService.createOrUpdateAssistant(
        agentType,
        config.generatedPrompt,
        workshopId
      );
      
      setSuccessMessage(`${agentType === 'nuggets' ? 'Elias' : 'Sonia'} agent configured and ready to use!`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error creating/updating assistant:', error);
      setError(`Failed to create/update ${agentType === 'nuggets' ? 'Elias' : 'Sonia'} agent. ${error.message}`);
      
      // Clear error message after a delay
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };
  
  if (!session) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>
              You need to be logged in to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Configure Workshop AI Agents</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : workshop ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{workshop.name}</h2>
              <p className="text-gray-600">{workshop.description}</p>
            </div>
            
            <Separator />
            
            {successMessage && (
              <Alert className="bg-green-50 border-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            <AIPromptManager 
              workshop={workshop}
              onSaveComplete={handlePromptSaveComplete}
            />
          </div>
        ) : (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Workshop Not Found</AlertTitle>
            <AlertDescription>
              The requested workshop could not be found. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
} 