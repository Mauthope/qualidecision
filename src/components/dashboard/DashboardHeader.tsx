'use client';

import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  Plus,
  Bot,
  AlertTriangle,
  Send
} from 'lucide-react';

interface DashboardHeaderProps {
  isSyncing: boolean;
  onRefresh: () => void;
  onNewConcession: () => void;
  onNewComplaint: () => void;
  onOpenAi: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isSyncing,
  onRefresh,
  onNewConcession,
  onNewComplaint,
  onOpenAi
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Painel de Qualidade e Lucratividade</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Atualizar dados da nuvem"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Nuvem Conectada'}</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
          Concessões e Scrap Evitado
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Monitore o volume expedido com desvio controlado, rentabilidade recuperada e histórico de entregas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
        <button
          type="button"
          onClick={onNewConcession}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Concessão</span>
        </button>

        <button
          type="button"
          onClick={onNewComplaint}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 shadow-sm transition-all cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Registrar SAC</span>
        </button>

        <button
          type="button"
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all cursor-pointer"
        >
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">Sensei IA</span>
        </button>
      </div>
    </header>
  );
};
