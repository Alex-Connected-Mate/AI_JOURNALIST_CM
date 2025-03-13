'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScan }) {
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const qrScannerRef = useRef(null);
  
  useEffect(() => {
    // Initialize scanner when component mounts
    if (!scannerRef.current) return;
    
    const config = {
      fps: 10,
      qrbox: 250,
      aspectRatio: 1.0,
    };
    
    const html5QrCode = new Html5Qrcode("qr-reader");
    qrScannerRef.current = html5QrCode;
    
    // Start scanning
    setScanning(true);
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // On successful scan
        onScan(decodedText);
        html5QrCode.stop();
        setScanning(false);
      },
      (errorMessage) => {
        // Don't set error during normal scanning operation
        if (errorMessage.includes("No QR code found")) {
          return;
        }
        setError(`Erreur de scan: ${errorMessage}`);
      }
    ).catch(err => {
      setError(`Impossible d'initialiser la caméra: ${err.message}`);
      setScanning(false);
    });
    
    // Cleanup function
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(err => {
          console.error("Erreur lors de l'arrêt du scanner:", err);
        });
      }
    };
  }, [onScan]);
  
  return (
    <div className="qr-scanner-container">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div 
        id="qr-reader" 
        ref={scannerRef}
        style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}
      ></div>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        {scanning 
          ? "Placez un code QR devant votre caméra..." 
          : "Initialisation de la caméra..."}
      </p>
    </div>
  );
} 