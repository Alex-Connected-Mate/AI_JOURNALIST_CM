import React, { useState, useEffect } from 'react';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { Message, SessionParticipant } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface LiveSessionProps {
  sessionId: string;
  userId: string;
}

export function LiveSession({ sessionId, userId }: LiveSessionProps) {
  const { session, messages, participants, actions, isLoading } = useRealtimeSession({
    sessionId,
    userId
  });

  const [messageInput, setMessageInput] = useState('');
  const { toast } = useToast();
  const [moderationSettings, setModerationSettings] = useState({
    autoModeration: true,
    participantLimit: 50,
    messageDelay: 0
  });

  // Contrôles de modération
  const moderationControls = {
    muteParticipant: async (participantId: string) => {
      try {
        await actions.updateParticipant(participantId, { status: 'muted' });
        toast({
          title: 'Participant muté',
          description: 'Le participant a été muté avec succès',
          type: 'success'
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de muter le participant',
          type: 'error'
        });
      }
    },

    removeParticipant: async (participantId: string) => {
      try {
        await actions.removeParticipant(participantId);
        toast({
          title: 'Participant retiré',
          description: 'Le participant a été retiré de la session',
          type: 'success'
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de retirer le participant',
          type: 'error'
        });
      }
    },

    updateSettings: (newSettings: typeof moderationSettings) => {
      setModerationSettings(newSettings);
      // Mettre à jour les paramètres dans la base de données
      actions.updateSession({ 
        settings: { moderation: newSettings } 
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await actions.sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return <div>Chargement de la session...</div>;
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-4rem)]">
      {/* Zone principale de chat */}
      <div className="col-span-8 flex flex-col h-full">
        <Card className="flex-grow overflow-y-auto p-4 mb-4">
          {messages.map((message, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-start">
                <div className="flex-grow">
                  <p className="font-semibold">
                    {participants[message.user_id]?.name || 'Utilisateur'}
                  </p>
                  <p className="text-gray-700">{message.content}</p>
                </div>
                {session?.user_id === userId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => actions.deleteMessage(message.id)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-grow p-2 border rounded"
            placeholder="Votre message..."
          />
          <Button type="submit">Envoyer</Button>
        </form>
      </div>

      {/* Panneau de contrôle et participants */}
      <div className="col-span-4">
        <Card className="p-4 mb-4">
          <h3 className="text-lg font-semibold mb-4">Contrôles de modération</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={moderationSettings.autoModeration}
                  onChange={(e) => moderationControls.updateSettings({
                    ...moderationSettings,
                    autoModeration: e.target.checked
                  })}
                />
                <span>Modération automatique</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Limite de participants</label>
              <input
                type="number"
                value={moderationSettings.participantLimit}
                onChange={(e) => moderationControls.updateSettings({
                  ...moderationSettings,
                  participantLimit: parseInt(e.target.value)
                })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Participants</h3>
          <div className="space-y-2">
            {Object.values(participants).map((participant) => (
              <div key={participant.id} className="flex items-center justify-between">
                <span>{participant.name}</span>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderationControls.muteParticipant(participant.id)}
                  >
                    Muter
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => moderationControls.removeParticipant(participant.id)}
                  >
                    Retirer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 