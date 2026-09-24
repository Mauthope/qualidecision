import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QualityProvider } from '@/context/QualityContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toast } from '@/components/Toast';
import { AiDrawer } from '@/components/chat/AiDrawer';

import { PwaRegister } from '@/components/pwa/PwaRegister';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800']
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Qualidecision - Gestão de Qualidade & Assistente Sensei',
  description: 'Sistema industrial de inteligência de qualidade, controle de desvios/concessões, tolerância de clientes e assistente IA Sensei. Desenvolvido por Mauricio Grigol.',
  authors: [{ name: 'Mauricio Grigol' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Qualidecision'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="theme-color" content="#060a13" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${outfit.variable} ${inter.variable} font-sans bg-[#060a13] text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-slate-950`}>
        <AuthProvider>
          <QualityProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <AiDrawer />
            <Toast />
            <PwaRegister />
          </QualityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
