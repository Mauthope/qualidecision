'use client';

import React, { useState } from 'react';
import { Customer, Complaint, ConcessionShipment } from '@/types';
import {
  Building2,
  Mail,
  MapPin,
  ShieldCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { ConcessionDecisionModal } from '@/components/clientes/ConcessionDecisionModal';

interface Props {
  customer: Customer;
  complaints: Complaint[];
  concessions: ConcessionShipment[];
}

export const CustomerProfileHeader: React.FC<Props> = ({ customer, complaints, concessions }) => {
  const [isConcessionOpen, setIsConcessionOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const totalSavedValue = concessions.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);
  const totalUnitsSaved = concessions.reduce((acc, c) => acc + (c.quantity || 0), 0);

  let scoreColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  let scoreLabel = 'Cliente Altamente Flexível';
  if (customer.overallToleranceScore < 50) {
    scoreColor = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    scoreLabel = 'Cliente Rígido / Baixa Tolerância';
  } else if (customer.overallToleranceScore < 75) {
    scoreColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    scoreLabel = 'Cliente com Tolerância Moderada';
  }

  const totalKgClaimed = complaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
  const avgKgClaimed = complaints.length > 0 ? Math.round(totalKgClaimed / complaints.length) : 0;

  let volumeRiskTag = 'Sem ocorrências';
  let volumeRiskColor = 'bg-slate-800 text-slate-400 border-slate-700';
  if (totalKgClaimed > 1000) {
    volumeRiskTag = 'Alto Volume Reclamado (>1.000 kg)';
    volumeRiskColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (totalKgClaimed > 100) {
    volumeRiskTag = 'Volume Médio Reclamado (100 - 1.000 kg)';
    volumeRiskColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (totalKgClaimed > 0) {
    volumeRiskTag = 'Baixo Volume Reclamado (<100 kg)';
    volumeRiskColor = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  }

  return (
    <>
      <div className="glow-card p-6 sm:p-7 rounded-3xl bg-slate-950/90 border border-slate-800/90 space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-10 w-96 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Info */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${customer.avatarColor} p-1 shadow-xl flex items-center justify-center font-extrabold text-white text-xl font-heading shrink-0`}>
              {customer.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {customer.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">CNPJ: {customer.cnpj}</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${volumeRiskColor}`}>
                  ⚖️ {volumeRiskTag}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                {customer.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  {customer.segment}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {customer.cityState}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.contactEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Tolerance Score Badge & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className={`px-4 py-2 rounded-2xl border ${scoreColor} flex items-center gap-3 shadow-inner`}>
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Índice Geral de Tolerância</div>
                <div className="text-xl font-extrabold font-mono leading-none mt-0.5">
                  {customer.overallToleranceScore}% <span className="text-xs font-normal font-sans opacity-90">({scoreLabel})</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsDecisionModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simular Decisão de Envio
              </button>

              <button
                onClick={() => setIsConcessionOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                + Concessão
              </button>
            </div>
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Reclamações ERP</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {complaints.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Volume Reclamado</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {totalKgClaimed.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-sans">kg</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Média: {avgKgClaimed} kg/rec</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Lotes com Concessão</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {concessions.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Volume Concedido</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
              {totalUnitsSaved.toLocaleString('pt-BR')} un
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px]">Scrap Economizado</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              R$ {totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {isConcessionOpen && (
        <NewConcessionModal
          isOpen={isConcessionOpen}
          defaultCustomerId={customer.id}
          onClose={() => setIsConcessionOpen(false)}
        />
      )}

      {isDecisionModalOpen && (
        <ConcessionDecisionModal
          isOpen={isDecisionModalOpen}
          customer={customer}
          onClose={() => setIsDecisionModalOpen(false)}
        />
      )}
    </>
  );
};
