'use client';

const { useEffect } = require('react');
const { notFound } = require('next/navigation');

// This component will catch all unmatched routes and trigger the not-found page
module.exports = function CatchAllNotFound() {
  useEffect(() => {
    // Trigger Next.js built-in not-found functionality
    notFound();
  }, []);
  
  // This won't be rendered, but needed for the component
  return null;
} 