'use client';

import React from 'react';

/**
 * Simple ThemeProvider component
 * Since the app uses Tailwind CSS, this is just a passthrough component
 * that can be extended later if needed for theme management
 */
export default function ThemeProvider({ children }) {
  return (
    <div className="theme-provider">
      {children}
    </div>
  );
}