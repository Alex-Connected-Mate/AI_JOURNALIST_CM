'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SessionStartedNotification({ session }) {
  const [show, setShow] = useState(true);
  
  // Masquer la notification après 10 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!show || !session) return null;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-green-200 p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="ml-3 w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-900">Session activée</h3>
          <p className="mt-1 text-sm text-gray-500">
            La session <span className="font-semibold">{session.name}</span> est maintenant active.
            Les participants peuvent la rejoindre.
          </p>
          <div className="mt-3 flex space-x-2">
            <Link
              href={`/sessions/${session.id}/run`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Lancer la présentation
            </Link>
            
            <button
              type="button"
              onClick={() => setShow(false)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fermer
            </button>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => setShow(false)}
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 