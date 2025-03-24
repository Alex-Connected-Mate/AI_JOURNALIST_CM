import React, { useState, useEffect } from 'react';
const { useRouter } = require('next/router');
const Head = require('next/head');
const { supabase } = require('@/lib/supabase');
const { useToast } = require('@/components/ui/use-toast');
const { Card, CardContent } = require('@/components/ui/card');
const { Button } = require('@/components/ui/button');
const { Spinner } = require('@/components/ui/spinner');
const AIPromptManager = require('@/components/AIPromptManager');

/**
 * Workshop Agents Page
 * 
 * This page allows workshop admins to configure AI agents for a specific workshop.
 * It includes prompt configuration for both Nuggets and Lightbulbs agents.
 */
const WorkshopAgentsPage = () => {
  const router = useRouter();
  const { id: workshopId } = router.query;
  const { toast } = useToast();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);

  // Load workshop data
  useEffect(() => {
    const loadWorkshop = async () => {
      if (!workshopId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('workshops')
          .select('*')
          .eq('id', workshopId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setWorkshop(data);
      } catch (error) {
        console.error('Error loading workshop:', error);
        toast({
          variant: "destructive",
          title: "Error loading workshop",
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkshop();
  }, [workshopId]);

  // Handle prompt save
  const handlePromptSave = async (agentType, config) => {
    toast({
      title: `${agentType === 'nuggets' ? 'Nuggets' : 'Lightbulbs'} agent configured`,
      description: "The prompt has been saved successfully."
    });
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">Workshop not found</h1>
            <p className="text-gray-600 mb-6">
              The workshop you're looking for could not be found or you don't have access to it.
            </p>
            <Button onClick={() => router.push('/admin/workshops')}>
              Back to Workshops
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Head>
        <title>AI Agents Configuration | {workshop.name}</title>
      </Head>

      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/admin/workshop/${workshopId}`)}
        >
          Back to Workshop
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">{workshop.name}</h1>
      <p className="text-gray-600 mb-8">Configure AI agents for this workshop</p>

      <AIPromptManager 
        workshop={workshop} 
        userId={user?.id}
        onSaveComplete={handlePromptSave} 
      />
    </div>
  );
};

module.exports = WorkshopAgentsPage; 