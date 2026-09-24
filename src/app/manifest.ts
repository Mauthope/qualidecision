import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Qualidecision • Gestão de Qualidade & Decisão Rafitec',
    short_name: 'Qualidecision',
    description: 'Sistema industrial de gestão de qualidade, controle de concessões e assistente IA Sensei.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#060a13',
    theme_color: '#060a13',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  };
}
