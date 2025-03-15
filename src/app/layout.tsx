import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import RootClientLayout from './RootClientLayout';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Interactive Sessions Platform',
  description: 'A platform for professors to create and manage interactive sessions',
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={DEFAULT_LANGUAGE}>
      <body className={`${inter.className} ${inter.variable} antialiased`}>
        <main className="min-h-screen relative">
          <div className="relative z-10">
            <RootClientLayout>
              {children}
            </RootClientLayout>
          </div>
        </main>
      </body>
    </html>
  );
} 