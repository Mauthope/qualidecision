import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sensei • Chão de Fábrica - Rafitec',
  description: 'Terminal operacional exclusivo do Sensei para orientação no chão de fábrica da Rafitec.',
  manifest: '/manifest-chao-de-fabrica.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sensei Fábrica'
  }
};

export default function ShopFloorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
