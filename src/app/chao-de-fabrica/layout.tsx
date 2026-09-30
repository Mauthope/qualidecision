import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sensei • Chão de Fábrica - Rafitec',
  description: 'Terminal operacional exclusivo do Sensei para orientação no chão de fábrica da Rafitec.',
  manifest: '/manifest-chao-de-fabrica.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sensei Fábrica'
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  }
};

export default function ShopFloorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
