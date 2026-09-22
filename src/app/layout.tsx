import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QualityProvider } from '@/context/QualityContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toast } from '@/components/Toast';
import { AiDrawer } from '@/components/chat/AiDrawer';

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
  title: 'PerfilCliente - Gestão de Concessões, Qualidade & Perfil de Clientes',
  description: 'Sistema industrial de inteligência de qualidade, controle de desvios/concessões, tolerância de clientes e assistente IA. Desenvolvido por Mauricio Grigol.',
  authors: [{ name: 'Mauricio Grigol' }]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${outfit.variable} ${inter.variable} font-sans bg-[#060a13] text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-slate-950`}>
        <AuthProvider>
          <QualityProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <AiDrawer />
            <Toast />
          </QualityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
