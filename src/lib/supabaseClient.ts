import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';

// Variables pour URL et clé Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Crée un client Supabase avec les variables d'environnement
 * Cette version est compatible avec SSR et le build statique
 */
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
};

// Créer une instance globale pour les environnements non-browser
let globalSupabase: SupabaseClient | undefined;
if (typeof window === 'undefined') {
  globalSupabase = createClient();
}

/**
 * Interface pour le retour du hook useSupabase
 */
interface UseSupabaseReturn {
  supabase: SupabaseClient;
  user: User | null;
}

/**
 * Hook pour utiliser Supabase dans un composant
 */
export function useSupabase(): UseSupabaseReturn {
  const [supabase] = useState<SupabaseClient>(() => {
    // Utiliser l'instance globale en SSR ou créer une nouvelle instance côté client
    return typeof window === 'undefined' ? globalSupabase as SupabaseClient : createClient();
  });
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Effet uniquement exécuté côté client
    if (typeof window === 'undefined') return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        setUser(session?.user || null);
      }
    );

    // Récupérer l'utilisateur actuel lors du montage
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  return { supabase, user };
} 