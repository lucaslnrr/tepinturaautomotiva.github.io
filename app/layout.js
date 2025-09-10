export const metadata = {
  title: "TE Pintura – Talão de Orçamento",
  description: "Gerador de orçamento em PDF (A5) para TE Pintura Automotiva",
};

import './globals.css';

export default function RootLayout({ children }){
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
