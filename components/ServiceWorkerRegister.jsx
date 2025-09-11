'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) return; // SW requires secure context
      // Register ASAP to help installability; no need to wait for load
      try { navigator.serviceWorker.register('sw.js'); } catch (_) {}
    }
  }, []);
  return null;
}
