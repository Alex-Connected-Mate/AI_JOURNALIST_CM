import './globals.css';
import RootClientLayout from '@/components/RootClientLayout';

export const metadata = {
  title: 'Interactive Sessions Platform',
  description: 'A platform for professors to create and manage interactive sessions',
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

export default function RootLayout({ 
  children 
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={DEFAULT_LANGUAGE}>
      <body className="antialiased">
        <RootClientLayout>
          <main className="min-h-screen relative">
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </RootClientLayout>
      </body>
    </html>
  );
} 