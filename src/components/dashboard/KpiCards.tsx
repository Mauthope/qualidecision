'use client';

import React from 'react';
import { useQuality } from '@/context/QualityContext';
import {
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

export const KpiCards: React.FC = () => {
  const { stats } = useQuality();

  const cards = [
    {
      title: 'Sacarias / Bags Salvos no Mês',
      value: `${stats.totalUnitsSaved.toLocaleString('pt-BR')} un`,
      subtitle: `${stats.totalConcessionsCount} lotes expedidos com concessão`,
      icon: <PackageCheck className="w-5 h-5 text-cyan-400" />,
      gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      borderColor: 'border-cyan-500/30',
      tag: '+18% vs mês anterior',
      tagColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'Scrap Evitado (Lucro Salvo)',
      value: `R$ ${stats.totalSavedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Economia direta ao não descartar material',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/30',
      tag: 'Alta Rentabilidade',
      tagColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'Taxa de Aceite de Concessões',
      value: `${stats.acceptanceRate.toFixed(1)}%`,
      subtitle: 'Lotes aceitos pelos clientes sem queixa',
      icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
      gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-teal-500/30',
      tag: 'Meta: >95%',
      tagColor: 'text-cyan-400 bg-cyan-500/10'
    },
    {
      title: 'Reclamações em Aberto / Análise',
      value: `${stats.activeComplaintsCount}`,
      subtitle: 'Não-conformidades pendentes no SAC',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/30',
      tag: stats.activeComplaintsCount > 0 ? 'Requer Atenção' : 'Tudo Normal',
      tagColor: stats.activeComplaintsCount > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`glow-card p-5 rounded-2xl bg-gradient-to-b ${card.gradient} border ${card.borderColor} flex flex-col justify-between space-y-3 relative overflow-hidden`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
              {card.icon}
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${card.tagColor} border border-current`}>
              {card.tag}
            </span>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">{card.title}</div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {card.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
