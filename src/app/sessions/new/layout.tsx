import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Créer une nouvelle session | Connected Mate',
  description: 'Configurez votre session interactive avec AI Journalist.',
};

export default function NewSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="new-session-layout">
      <Header />
      {children}
    </div>
  );
} 