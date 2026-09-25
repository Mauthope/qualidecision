'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const PwaRegister: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const hasRestoredRouteRef = useRef(false);

  // 1. Registro do Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registrado no escopo:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Falha ao registrar Service Worker:', err);
          });
      });
    }
  }, []);

  // 2. Injeção Dinâmica do Manifesto PWA (Garante manifesto dedicado do Chão de Fábrica ao instalar dessa rota)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const targetManifest = pathname === '/chao-de-fabrica'
      ? '/manifest-chao-de-fabrica.json'
      : '/manifest.json';

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (manifestLink) {
      if (manifestLink.getAttribute('href') !== targetManifest) {
        manifestLink.setAttribute('href', targetManifest);
      }
    } else {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = targetManifest;
      document.head.appendChild(manifestLink);
    }
  }, [pathname]);

  // 3. Persistência e Restauração de Rota no Modo PWA Standalone (Cold Start)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // Ao reabrir o PWA (início frio): se o usuário estava no chão de fábrica, restaura imediatamente
    if (isStandalone && !hasRestoredRouteRef.current) {
      hasRestoredRouteRef.current = true;
      const sessionActive = sessionStorage.getItem('pwa_session_active');

      if (!sessionActive) {
        sessionStorage.setItem('pwa_session_active', 'true');
        const lastRoute = localStorage.getItem('pwa_last_active_route');
        if (pathname === '/' && lastRoute && lastRoute !== '/') {
          router.replace(lastRoute);
          return;
        }
      }
    }

    // Salva a última rota ativa relevante (ignora páginas transitórias de login ou erro)
    if (pathname && !pathname.includes('/login') && !pathname.includes('/_not-found')) {
      localStorage.setItem('pwa_last_active_route', pathname);
    }
  }, [pathname, router]);

  return null;
};
