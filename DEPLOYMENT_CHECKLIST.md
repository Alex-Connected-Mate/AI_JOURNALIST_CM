# Deployment Checklist for Vercel

This document outlines the critical steps and verifications needed before and after deploying the application to Vercel.

## Pre-Deployment Checklist

### Environment Variables
Ensure these environment variables are configured in the Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase instance
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for Supabase client access
- `NEXT_PUBLIC_APP_URL`: The URL where your application will be hosted

### Code Quality Checks
- [ ] TypeScript errors are addressed or properly handled via `ignoreBuildErrors` in next.config.js
- [ ] ESLint errors are addressed or properly handled via `ignoreDuringBuilds` in next.config.js
- [ ] No duplicated middleware implementations (only one middleware.js should exist)

### Supabase Integration
- [ ] Supabase client is properly initialized with environment variables
- [ ] Authentication flow is working correctly
- [ ] Database tables and schemas are created and match application expectations
- [ ] RLS (Row Level Security) policies are properly configured

### Next.js Configuration
- [ ] `next.config.js` is properly configured for production
- [ ] Image domains are correctly configured
- [ ] Correct experimental features are enabled for the current Next.js version
- [ ] Webpack fallbacks are properly configured for Node.js polyfills

## Deployment Process

1. Commit all changes to your repository
2. Push to the branch configured for deployment in Vercel
3. Monitor the build logs in the Vercel dashboard for any errors
4. If the build fails, check the logs for specific errors and address them

## Post-Deployment Verification

- [ ] Visit the deployed site and verify it loads correctly
- [ ] Test authentication features (login, logout, registration)
- [ ] Test main application functionality
- [ ] Check browser console for JavaScript errors
- [ ] Verify all API routes are working correctly
- [ ] Test error handling and edge cases

## Common Deployment Issues and Solutions

### Environment Variable Issues
- **Symptom**: Supabase connection errors or "Invalid API key" errors
- **Solution**: Verify environment variables are set correctly in Vercel project settings

### Build Failures
- **Symptom**: Build fails with TypeScript errors
- **Solution**: Address the TypeScript errors or set `typescript.ignoreBuildErrors` to true in next.config.js

### Middleware Errors
- **Symptom**: Redirects not working or authentication issues
- **Solution**: Ensure only one middleware file exists and is correctly implemented

### API Route Errors
- **Symptom**: API routes return 500 errors
- **Solution**: Check server-side code for errors, ensure environment variables are accessible

### Image Optimization Issues
- **Symptom**: Images fail to load or optimize
- **Solution**: Verify image domains are correctly configured in next.config.js

## Emergency Rollback Procedure

If a deployment causes critical issues:
1. Go to the Vercel dashboard for your project
2. Navigate to the "Deployments" tab
3. Find the last working deployment
4. Click the three dots menu (⋮) and select "Promote to Production" 
