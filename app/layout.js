export const metadata = {
  title: "TE Pintura – Talão de Orçamento",
  description: "Gerador de orçamento em PDF (A5) para TE Pintura Automotiva",
};

import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export default function RootLayout({ children }){
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/logo_te.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo_te.svg" />
      </head>
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
