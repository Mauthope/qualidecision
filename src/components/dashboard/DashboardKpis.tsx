'use client';

import React from 'react';
import {
  PackageCheck,
  Scale,
  DollarSign,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface DashboardKpisProps {
  totalUnits: number;
  totalWeightKg: number;
  totalSaved: number;
  avgSavedPerUnit: number;
  acceptanceRate: number;
  hasActiveFilters: boolean;
  sackWeightGrams?: number;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({
  totalUnits,
  totalWeightKg,
  totalSaved,
  avgSavedPerUnit,
  acceptanceRate,
  hasActiveFilters,
  sackWeightGrams = 77.73
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Volume Total Concedido */}
      <div className="group glow-card p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.12)] space-y-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
        
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-heading">
            Volume Concedido
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 transition-transform duration-300 group-hover:scale-110">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-extrabold font-mono text-cyan-300 tracking-tight">
            {totalUnits.toLocaleString('pt-BR')} <span className="text-xs font-sans font-normal text-slate-400">un</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-mono text-xs font-bold">
            <Scale className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>
              {totalWeightKg >= 10000
                ? `${Math.round(totalWeightKg).toLocaleString('pt-BR')} kg`
                : `${totalWeightKg.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kg`}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="truncate">
            {hasActiveFilters ? 'Filtro atual' : 'Sacarias salvas de descarte'}
          </span>
          {totalWeightKg > 0 && (
            <span
              className="font-mono text-slate-500 text-[10px] shrink-0 ml-2"
              title={`Média no Memorial: ${sackWeightGrams}g/unidade`}
            >
              ~{(totalWeightKg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ton
            </span>
          )}
        </div>
      </div>

      {/* 2. Lucro Salvo (Scrap Evitado) */}
      <div className="group glow-card p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)] space-y-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />

        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-heading">
            Scrap Evitado
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 transition-transform duration-300 group-hover:scale-110">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
          R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <p className="text-[11px] text-slate-400">
          Receita preservada diretamente
        </p>
      </div>

      {/* 3. Valor Médio Recuperado */}
      <div className="group glow-card p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] space-y-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent" />

        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-heading">
            Média por Sacaria
          </span>
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 transition-transform duration-300 group-hover:scale-110">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl font-extrabold font-mono text-teal-300 tracking-tight">
          R$ {avgSavedPerUnit.toFixed(2)} <span className="text-xs font-sans font-normal text-slate-400">/unidade</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Média ponderada do lote
        </p>
      </div>

      {/* 4. Taxa de Aceite Técnico */}
      <div className="group glow-card p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] space-y-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/25 to-transparent" />

        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-heading">
            Aceite Técnico
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 transition-transform duration-300 group-hover:scale-110">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl font-extrabold font-mono text-purple-300 tracking-tight">
          {acceptanceRate.toFixed(1)}%
        </div>

        <p className="text-[11px] text-slate-400">
          Entregas sem reclamação no SAC
        </p>
      </div>
    </div>
  );
};
