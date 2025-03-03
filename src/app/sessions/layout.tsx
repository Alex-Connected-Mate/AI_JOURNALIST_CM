import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sessions | Connected Mate',
  description: 'Gérez vos sessions interactives sur Connected Mate',
};

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sessions-layout">
      {children}
    </div>
  );
} 