import React from 'react';
import Link from 'next/link';

// This custom error page overrides Next.js's built-in error handling
// It avoids using any client-side only hooks like useSearchParams
function CustomError({ statusCode }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {statusCode || 'Erreur'}
        </h1>
        <h2 className="text-xl font-medium text-gray-700 mb-6">
          {statusCode === 404 ? 'Page non trouvée' : 'Une erreur est survenue'}
        </h2>
        <p className="text-gray-600 mb-8">
          {statusCode === 404
            ? "La page que vous recherchez n'existe pas ou a été déplacée."
            : "Nous sommes désolés pour ce désagrément. Veuillez réessayer ultérieurement."}
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

// This ensures the page works correctly on both client and server
CustomError.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default CustomError; 