#!/bin/bash

echo "🚀 Starting custom build script for Vercel..."

# Set environment variables for optimized build
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
export NEXT_MINIMAL_ERROR_HANDLING=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
if [ -f "./scripts/pre-deploy-check.js" ]; then
  node ./scripts/pre-deploy-check.js
  CHECK_STATUS=$?
  
  if [ $CHECK_STATUS -ne 0 ]; then
    echo "❌ Pre-deployment checks failed. Aborting build."
    exit $CHECK_STATUS
  else
    echo "✅ Pre-deployment checks passed."
  fi
else
  echo "⚠️ Pre-deployment check script not found. Skipping checks."
fi

# Validate environment variables
echo "🔍 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "⚠️ WARNING: NEXT_PUBLIC_SUPABASE_URL is not set. This may cause issues with Supabase connectivity."
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️ WARNING: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. This may cause issues with Supabase connectivity."
fi

# Run Next.js build with TypeScript check disabled but using Next.js's built-in handling
echo "🚀 Running Next.js build with optimized settings..."
NEXT_TELEMETRY_DISABLED=1 NEXT_TYPECHECK=false next build

# Check build status
BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
  echo "✅ Build completed successfully!"
  
  # Create a metadata file in the .next directory to track build info
  echo "📝 Creating build metadata..."
  cat > ./.next/BUILD_INFO.json << EOL
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node -v)",
  "npmVersion": "$(npm -v)",
  "environment": "${NODE_ENV}",
  "vercelEnv": "${VERCEL_ENV:-development}"
}
EOL
  
  echo "✅ Deployment preparation complete. Ready for Vercel deployment."
else
  echo "❌ Build failed with exit code $BUILD_STATUS"
  exit $BUILD_STATUS
fi 