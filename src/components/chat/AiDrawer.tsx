'use client';

import React, { useEffect } from 'react';
import { useQuality } from '@/context/QualityContext';
import { Bot, X, Sparkles, Maximize2, Database, ShieldCheck } from 'lucide-react';
import { QualityAiChat } from './QualityAiChat';

export const AiDrawer: React.FC = () => {
  const { isAiDrawerOpen, closeAiDrawer } = useQuality();

  // Handle ESC key to close full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAiDrawerOpen) {
        closeAiDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiDrawerOpen, closeAiDrawer]);

  if (!isAiDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060a13] flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Bar / Fullscreen Header */}
      <header className="px-4 sm:px-8 py-3.5 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0 shadow-lg shadow-black/40">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white font-heading">
                Assistente Inteligente de Qualidade & Decisão
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase tracking-wider">
                Tela Inteira
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Varredura de reclamações de clientes, evidências fotográficas e simulação de risco de liberação
            </p>
          </div>
        </div>

        {/* Right Info & Close Button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Base ERP Conectada</span>
          </div>

          <button
            onClick={closeAiDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all text-xs font-semibold shadow-sm cursor-pointer"
            title="Fechar Tela Inteira (ESC)"
          >
            <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
            <span className="hidden sm:inline">Fechar [ESC]</span>
          </button>
        </div>
      </header>

      {/* Main Fullscreen Chat Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col overflow-hidden px-2 sm:px-6 py-3">
        <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md">
          <QualityAiChat isDrawer={false} />
        </div>
      </main>
    </div>
  );
};
