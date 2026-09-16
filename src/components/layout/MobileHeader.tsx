'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, ShieldCheck, Bot, PlusCircle } from 'lucide-react';
import { useQuality } from '@/context/QualityContext';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar }) => {
  const { openAiDrawer, stats } = useQuality();
  const [isNewConcessionOpen, setIsNewConcessionOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between shadow-lg shadow-black/20">
        {/* Left: Menu trigger & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors relative cursor-pointer"
            aria-label="Abrir Menu de Navegação"
          >
            <Menu className="w-5 h-5" />
            {stats.activeComplaintsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {stats.activeComplaintsCount}
              </span>
            )}
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">
              Perfil<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Cliente</span>
            </span>
          </Link>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAiDrawer()}
            className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
            title="Assistente IA"
            aria-label="Assistente IA"
          >
            <Bot className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsNewConcessionOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">Novo Envio</span>
          </button>
        </div>
      </header>

      {isNewConcessionOpen && (
        <NewConcessionModal
          isOpen={isNewConcessionOpen}
          onClose={() => setIsNewConcessionOpen(false)}
        />
      )}
    </>
  );
};
