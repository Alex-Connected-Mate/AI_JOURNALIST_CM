'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';

// This component will catch all unmatched routes and trigger the not-found page
export default function CatchAllNotFound() {
  useEffect(() => {
    // Trigger Next.js built-in not-found functionality
    notFound();
  }, []);
  
  // This won't be rendered, but needed for the component
  return null;
} 