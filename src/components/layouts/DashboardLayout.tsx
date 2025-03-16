import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const workshopId = router.query.id as string;
  
  // Check if we're in a workshop context
  const isWorkshopContext = router.pathname.includes('/workshop/');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            {isWorkshopContext && workshopId && (
              <nav className="flex space-x-4">
                <Link 
                  href={`/workshop/${workshopId}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === `/workshop/[id]` 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Overview
                </Link>
                <Link 
                  href={`/workshop/${workshopId}/participants`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === `/workshop/[id]/participants` 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Participants
                </Link>
                <Link 
                  href={`/workshop/${workshopId}/ai-prompts`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === `/workshop/[id]/ai-prompts` 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  AI Prompts
                </Link>
                <Link 
                  href={`/workshop/${workshopId}/settings`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === `/workshop/[id]/settings` 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Settings
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
} 