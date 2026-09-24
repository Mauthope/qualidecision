'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Tablet,
  CheckCircle2,
  Share,
  PlusSquare,
  X,
  Sparkles,
  ArrowDownToLine,
  ExternalLink
} from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'header' | 'compact' | 'badge';
  label?: string;
}

export const PwaInstallButton: React.FC<Props> = ({
  className = '',
  variant = 'header',
  label = 'Instalar App'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if already installed / standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledSuccessfully(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Erro ao acionar prompt de instalação:', err);
        setIsModalOpen(true);
      }
    } else {
      // Show instructional modal for iOS or browsers without native prompt
      setIsModalOpen(true);
    }
  };

  // If already installed and running standalone, show subtle verified status badge
  if (isStandalone) {
    if (variant === 'compact') {
      return (
        <div
          className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          title="Aplicativo PWA Instalado e Ativo"
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Instalado</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
          variant === 'header'
            ? 'bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 hover:border-cyan-400 shadow-cyan-500/10'
            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
        } ${className}`}
        title="Baixar e Instalar o aplicativo no celular, tablet ou computador (PWA)"
      >
        <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 group-hover:animate-bounce transition-transform" />
        <span className="hidden xs:inline">{label}</span>
        <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase rounded bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 font-extrabold hidden md:inline">
          PWA
        </span>
      </button>

      {/* Instructional Modal for iOS or manual install */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <img
                      src="/icons/icon-192x192.png"
                      alt="Qualidecision"
                      className="w-8 h-8 rounded-lg object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-heading">
                    Instalar Qualidecision
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aplicativo Web Progressivo (PWA)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              Instale o <strong>Qualidecision & IA Sensei</strong> como aplicativo nativo no seu celular ou tablet. O app ocupará menos de 1 MB, abrirá em tela cheia e funcionará com acesso rápido direto da sua tela de início.
            </p>

            {/* Instructions based on OS */}
            {isIos ? (
              <div className="space-y-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Instruções para iPhone & iPad (Safari):
                </div>
                <ol className="space-y-2.5 text-slate-300 text-xs pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <span>
                      Toque no botão <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> na barra inferior do navegador Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <span>
                      Role o menu para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" />.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      3
                    </span>
                    <span>
                      Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito. Pronto!
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Tablet className="w-4 h-4" />
                  Instruções para Android, Chrome & Edge:
                </div>
                <ol className="space-y-2.5 text-slate-300 text-xs pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <span>
                      Toque no menu do navegador (os <strong>três pontinhos</strong> ⠇ no topo ou rodapé).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <span>
                      Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      3
                    </span>
                    <span>
                      Toque em <strong>"Instalar"</strong> para concluir a instalação do atalho oficial.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
