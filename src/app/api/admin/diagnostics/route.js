import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * API route pour les diagnostics système
 * Compatible avec Vercel
 */
export async function GET() {
  try {
    const results = [];
    
    // 1. Vérifier la connexion à Supabase
    try {
      const { data, error } = await supabase.from('sessions').select('id').limit(1);
      
      if (error) {
        results.push({
          name: 'Connexion Supabase',
          status: 'error',
          message: `Erreur de connexion à Supabase: ${error.message}`
        });
      } else {
        results.push({
          name: 'Connexion Supabase',
          status: 'success',
          message: 'Connexion à Supabase établie avec succès'
        });
      }
    } catch (error) {
      results.push({
        name: 'Connexion Supabase',
        status: 'error',
        message: `Erreur de connexion à Supabase: ${error.message}`
      });
    }
    
    // 2. Vérifier les variables d'environnement critiques
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL', 
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      results.push({
        name: 'Variables d\'environnement',
        status: 'error',
        message: `Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`
      });
    } else {
      results.push({
        name: 'Variables d\'environnement',
        status: 'success',
        message: 'Toutes les variables d\'environnement requises sont définies'
      });
    }
    
    // 3. Vérifier si nous sommes sur Vercel
    if (process.env.VERCEL) {
      results.push({
        name: 'Environnement Vercel',
        status: 'success',
        message: `Déployé sur Vercel (${process.env.VERCEL_ENV || 'unknown'})`
      });
    } else {
      results.push({
        name: 'Environnement Vercel',
        status: 'warning',
        message: 'Application non déployée sur Vercel'
      });
    }
    
    // 4. Vérifier la configuration de Next.js (sans accès au système de fichiers sur Vercel)
    if (process.env.NODE_ENV === 'development') {
      try {
        const nextConfigPath = path.join(process.cwd(), 'next.config.js');
        const configContent = fs.readFileSync(nextConfigPath, 'utf8');
        
        if (configContent.includes('<<<<<<<')) {
          results.push({
            name: 'Configuration Next.js',
            status: 'error',
            message: 'Conflit Git détecté dans next.config.js'
          });
        } else {
          results.push({
            name: 'Configuration Next.js',
            status: 'success',
            message: 'Configuration Next.js valide'
          });
        }
      } catch (error) {
        // Ne pas échouer si nous ne pouvons pas lire le fichier (cas de Vercel)
        results.push({
          name: 'Configuration Next.js',
          status: 'warning',
          message: 'Impossible de vérifier next.config.js en environnement production'
        });
      }
    } else {
      // En production, nous supposons que la configuration est correcte (sinon le build aurait échoué)
      results.push({
        name: 'Configuration Next.js',
        status: 'success',
        message: 'Configuration Next.js valide (vérifiée lors du build)'
      });
    }
    
    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de l\'exécution des diagnostics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution des diagnostics' },
      { status: 500 }
    );
  }
} 