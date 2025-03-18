import React from 'react';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-xl font-medium text-gray-700 mb-6">Page non trouvée</h2>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </Link>
          <Link 
            href="/" 
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Page d'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

// Force server-side rendering for this page
export async function getStaticProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
} 