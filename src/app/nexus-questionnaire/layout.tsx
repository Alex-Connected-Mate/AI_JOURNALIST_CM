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