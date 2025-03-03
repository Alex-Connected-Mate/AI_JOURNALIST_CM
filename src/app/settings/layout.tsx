import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réglages du compte | Connected Mate',
  description: 'Gérez vos informations personnelles et les paramètres de votre compte.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="settings-layout">
      {children}
    </div>
  );
} 