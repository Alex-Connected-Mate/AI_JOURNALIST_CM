'use client';

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

export default function QRCode({
  value,
  size = 200,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  level = 'M',
  includeMargin = true,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const options = {
      errorCorrectionLevel: level,
      margin: includeMargin ? 4 : 0,
      width: size,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    };
    
    QRCodeLib.toCanvas(canvasRef.current, value, options, (error) => {
      if (error) console.error('Error generating QR code:', error);
    });
  }, [value, size, bgColor, fgColor, level, includeMargin]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: size, 
        height: size 
      }} 
    />
  );
} 