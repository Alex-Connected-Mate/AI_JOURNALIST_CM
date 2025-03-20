'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/use-toast';

export default function NexusQuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

export const metadata = {
  title: 'Nexus X Insead Questionnaire - AI Journalist',
  description: 'Configure and launch the specialized AI Journalist for the Nexus X Insead questionnaire',
}; 