import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord | Connected Mate',
  description: 'Gérez vos sessions interactives sur Connected Mate',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  );
} 