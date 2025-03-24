const { NextResponse } = require('next/server');
const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
const { cookies } = require('next/headers');

/**
 * API pour vérifier l'état de l'application et diagnostiquer les problèmes
 * Route: /api/diagnostics
 */
module.exports.GET = async function() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    status: 'running',
    checks: [],
    environment: process.env.NODE_ENV,
    vercelEnvironment: process.env.VERCEL_ENV || 'development',
    buildTime: process.env.BUILD_TIME || 'unknown',
    region: process.env.VERCEL_REGION || 'unknown',
  };

  try {
    // 1. Vérifier les variables d'environnement critiques
    const checkEnvVars = () => {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        diagnostics.checks.push({
          name: 'Environment Variables',
          status: 'error',
          details: `Missing variables: ${missingVars.join(', ')}`,
        });
        return false;
      } else {
        diagnostics.checks.push({
          name: 'Environment Variables',
          status: 'success',
          details: 'All required environment variables are set',
        });
        return true;
      }
    };

    // 2. Vérifier la connexion à Supabase
    const checkSupabaseConnection = async () => {
      try {
        const supabase = createRouteHandlerClient({ cookies });
        
        // Tester une requête simple pour vérifier la connexion
        const { data, error } = await supabase.from('_diagnostics_check')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          // Si l'erreur est que la table n'existe pas, c'est OK - la connexion fonctionne
          if (error.code === 'PGRST116') {
            diagnostics.checks.push({
              name: 'Supabase Connection',
              status: 'success',
              details: 'Connected successfully to Supabase (table does not exist but connection works)',
            });
            return true;
          } else {
            diagnostics.checks.push({
              name: 'Supabase Connection',
              status: 'error',
              details: `Error connecting to Supabase: ${error.message} (${error.code})`,
            });
            return false;
          }
        } else {
          diagnostics.checks.push({
            name: 'Supabase Connection',
            status: 'success',
            details: 'Connected successfully to Supabase',
          });
          return true;
        }
      } catch (error) {
        diagnostics.checks.push({
          name: 'Supabase Connection',
          status: 'error',
          details: `Error initializing Supabase client: ${error.message}`,
        });
        return false;
      }
    };

    // 3. Vérifier la disponibilité de l'API
    const checkApiAvailability = () => {
      diagnostics.checks.push({
        name: 'API Availability',
        status: 'success',
        details: 'This API is responding correctly',
      });
      return true;
    };

    // 4. Exécuter toutes les vérifications
    const envVarsOk = checkEnvVars();
    const apiOk = checkApiAvailability();
    const supabaseOk = await checkSupabaseConnection();
    
    // Déterminer l'état global
    if (envVarsOk && apiOk && supabaseOk) {
      diagnostics.status = 'healthy';
    } else if (!envVarsOk || !supabaseOk) {
      diagnostics.status = 'critical';
    } else {
      diagnostics.status = 'degraded';
    }

    return NextResponse.json(diagnostics, {
      status: diagnostics.status === 'critical' ? 500 : 200,
    });
  } catch (error) {
    console.error('Error in diagnostics API:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
} 