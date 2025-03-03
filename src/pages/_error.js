import React from 'react';
import Link from 'next/link';

// This custom error page overrides Next.js's built-in error handling
// It avoids using any client-side only hooks like useSearchParams
function CustomError({ statusCode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {statusCode || 'Error'}
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {statusCode === 404 ? 'Page Not Found' : 'Something went wrong'}
        </h2>
        <p className="text-gray-600 mb-8">
          {statusCode === 404
            ? "The page you are looking for doesn't exist or has been moved."
            : "We apologize for the inconvenience. Please try again later."}
        </p>
        
        <Link 
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Return Home
        </Link>
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