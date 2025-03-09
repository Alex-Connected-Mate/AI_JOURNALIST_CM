'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Récupérer les variables d'environnement pour Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Interface pour les paramètres de page
interface PageParams {
  id: string;
}

// Interface pour la configuration du widget
interface WidgetConfig {
  id?: string;
  agent_id: string;
  primary_color: string;
  secondary_color: string;
  gradient_enabled: boolean;
  gradient_start_color: string;
  gradient_end_color: string;
  widget_position: string;
  widget_size: string;
  chat_bubble_text: string;
  is_active: boolean;
  company_logo_public_url?: string;
  company_logo_storage_path?: string;
  [key: string]: any; // Pour les propriétés supplémentaires
}

/**
 * Page de configuration du widget
 * 
 * Cette page permet de configurer l'apparence et le comportement
 * du widget pour un agent spécifique.
 */
export default function WidgetSettingsPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const agentId = params.id;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    agent_id: agentId,
    primary_color: '#007AFF',
    secondary_color: '#FFFFFF',
    gradient_enabled: false,
    gradient_start_color: '#007AFF',
    gradient_end_color: '#00C6FF',
    widget_position: 'bottom-right',
    widget_size: 'medium',
    chat_bubble_text: 'Comment puis-je vous aider ?',
    is_active: true
  });
  
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  
  // Positions possibles du widget
  const positionOptions = [
    { value: 'bottom-right', label: 'En bas à droite' },
    { value: 'bottom-left', label: 'En bas à gauche' },
    { value: 'top-right', label: 'En haut à droite' },
    { value: 'top-left', label: 'En haut à gauche' }
  ];
  
  // Tailles possibles du widget
  const sizeOptions = [
    { value: 'small', label: 'Petit' },
    { value: 'medium', label: 'Moyen' },
    { value: 'large', label: 'Grand' }
  ];
  
  // Charger les données de l'agent et la configuration du widget
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Récupérer les informations de l'agent
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .single();
        
        if (agentError) {
          throw new Error('Agent non trouvé');
        }
        
        setAgent(agentData);
        
        // Récupérer la configuration du widget
        const { data: configData, error: configError } = await supabase
          .from('widget_configurations')
          .select('*')
          .eq('agent_id', agentId)
          .single();
        
        // Si une configuration existe, l'utiliser
        if (configData) {
          setWidgetConfig({
            ...widgetConfig,
            ...configData
          });
        }
        
        // Définir l'URL de prévisualisation
        setPreviewUrl(`/widget/${agentId}`);
        
        // Générer le code d'intégration
        const origin = window.location.origin;
        setEmbedCode(`<script src="${origin}/api/widget/${agentId}/embed"></script>`);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    }
    
    if (agentId) {
      loadData();
    }
  }, [agentId, supabase, widgetConfig]);
  
  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setWidgetConfig((prev: WidgetConfig) => ({ ...prev, [name]: checked }));
    } else {
      setWidgetConfig((prev: WidgetConfig) => ({ ...prev, [name]: value }));
    }
  };
  
  // Enregistrer la configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Vérifier si une configuration existe déjà
      const { data: existingConfig } = await supabase
        .from('widget_configurations')
        .select('id')
        .eq('agent_id', agentId)
        .single();
      
      if (existingConfig) {
        // Mettre à jour la configuration existante
        const { error: updateError } = await supabase
          .from('widget_configurations')
          .update({
            ...widgetConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
        
        if (updateError) throw updateError;
      } else {
        // Créer une nouvelle configuration
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        
        const { error: insertError } = await supabase
          .from('widget_configurations')
          .insert({
            ...widgetConfig,
            agent_id: agentId,
            created_by: userId,
            updated_by: userId
          });
        
        if (insertError) throw insertError;
      }
      
      // Rediriger vers la page d'agents avec un message de succès
      router.push('/settings?success=widget_config_saved');
    } catch (err) {
      console.error('Error saving widget configuration:', err);
      setError('Erreur lors de l\'enregistrement de la configuration');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Agent non trouvé. Veuillez vérifier l'identifiant de l'agent.
              </p>
            </div>
          </div>
        </div>
        <Link href="/settings" className="cm-button">
          Retour aux paramètres
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuration du widget pour {agent.name}</h1>
        <Link href="/settings" className="cm-button-secondary">
          Retour
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de configuration */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Apparence</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur principale
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="primary_color"
                    value={widgetConfig.primary_color}
                    onChange={handleChange}
                    className="w-12 h-8 border border-gray-300 rounded mr-2"
                  />
                  <input
                    type="text"
                    name="primary_color"
                    value={widgetConfig.primary_color}
                    onChange={handleChange}
                    className="cm-input flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Couleur utilisée pour le bouton et les messages de l'utilisateur
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur secondaire
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="secondary_color"
                    value={widgetConfig.secondary_color}
                    onChange={handleChange}
                    className="w-12 h-8 border border-gray-300 rounded mr-2"
                  />
                  <input
                    type="text"
                    name="secondary_color"
                    value={widgetConfig.secondary_color}
                    onChange={handleChange}
                    className="cm-input flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Couleur de fond du widget
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <input
                  type="checkbox"
                  name="gradient_enabled"
                  checked={widgetConfig.gradient_enabled}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Activer le dégradé pour le bouton
              </label>
              
              {widgetConfig.gradient_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Début du dégradé
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        name="gradient_start_color"
                        value={widgetConfig.gradient_start_color}
                        onChange={handleChange}
                        className="w-12 h-8 border border-gray-300 rounded mr-2"
                      />
                      <input
                        type="text"
                        name="gradient_start_color"
                        value={widgetConfig.gradient_start_color}
                        onChange={handleChange}
                        className="cm-input flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fin du dégradé
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        name="gradient_end_color"
                        value={widgetConfig.gradient_end_color}
                        onChange={handleChange}
                        className="w-12 h-8 border border-gray-300 rounded mr-2"
                      />
                      <input
                        type="text"
                        name="gradient_end_color"
                        value={widgetConfig.gradient_end_color}
                        onChange={handleChange}
                        className="cm-input flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position du widget
                </label>
                <select
                  name="widget_position"
                  value={widgetConfig.widget_position}
                  onChange={handleChange}
                  className="cm-input w-full"
                >
                  {positionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Position du bouton et du widget sur la page
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille du widget
                </label>
                <select
                  name="widget_size"
                  value={widgetConfig.widget_size}
                  onChange={handleChange}
                  className="cm-input w-full"
                >
                  {sizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Taille de la fenêtre de chat
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texte de la bulle
              </label>
              <input
                type="text"
                name="chat_bubble_text"
                value={widgetConfig.chat_bubble_text}
                onChange={handleChange}
                className="cm-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Texte affiché dans l'en-tête du widget
              </p>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={widgetConfig.is_active}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Activer le widget
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Si désactivé, le widget ne sera pas accessible
              </p>
            </div>
            
            <h2 className="text-lg font-semibold mb-4 mt-8">Intégration</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code d'intégration
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  value={embedCode}
                  className="cm-input w-full h-20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    alert('Code copié !');
                  }}
                  className="absolute right-2 top-2 p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ajoutez ce code à votre site pour intégrer le widget
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL directe
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${previewUrl}`}
                  className="cm-input w-full font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${previewUrl}`);
                    alert('URL copiée !');
                  }}
                  className="absolute right-2 top-2 p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL pour accéder directement au widget
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="cm-button px-6 py-2"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </span>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Prévisualisation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4">Prévisualisation</h2>
            
            <div className="aspect-w-4 aspect-h-6 border rounded-md overflow-hidden mb-4">
              <iframe src={previewUrl} className="w-full h-full" />
            </div>
            
            <div className="text-center">
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="cm-button-secondary inline-block"
              >
                Ouvrir en plein écran
              </a>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Comment ça marche ?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Le widget permet à vos visiteurs d'interagir avec votre agent IA directement sur votre site web.</p>
                  <p className="mt-2">Personnalisez son apparence, puis intégrez-le avec le code fourni. Vous pouvez également partager l'URL directe.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 