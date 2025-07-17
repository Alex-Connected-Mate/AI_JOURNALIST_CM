'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * AppInitializer component
 * Handles application initialization logic when the app starts
 */
export default function AppInitializer({ children }) {
  const { initApp } = useStore();

  useEffect(() => {
    // Initialize the application
    const initialize = async () => {
      try {
        // Call store initialization if it exists
        if (initApp && typeof initApp === 'function') {
          await initApp();
        }
        
        console.log('Application initialized successfully');
      } catch (error) {
        console.error('Error initializing application:', error);
      }
    };

    initialize();
  }, [initApp]);

  return children;
}