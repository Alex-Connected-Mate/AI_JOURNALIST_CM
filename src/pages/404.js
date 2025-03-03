import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// A component that safely uses useSearchParams within Suspense
const SearchParamsComponent = () => {
  const searchParams = useSearchParams();
  const referrer = searchParams?.get('from') || '';
  
  return (
    <p className="text-gray-600 mb-8">
      {referrer ? `You were redirected from ${referrer}` : ''}
    </p>
  );
};

// Wrap any component that uses useSearchParams in Suspense
const NotFoundPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        {/* Suspense boundary for the SearchParams component */}
        <Suspense fallback={<p className="text-gray-400 mb-8">Loading...</p>}>
          <SearchParamsComponent />
        </Suspense>
        
        <Link 
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 