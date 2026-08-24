'use client';

import React from 'react';
import { Customer, Complaint, ConcessionShipment } from '@/types';
import Link from 'next/link';
import {
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  FileWarning
} from 'lucide-react';

interface Props {
  customer: Customer;
  concessions: ConcessionShipment[];
  complaints: Complaint[];
}

export const ConcessionVsComplaintComparison: React.FC<Props> = ({
  customer,
  concessions,
  complaints
}) => {
  // Analyze each concession and cross-reference with complaints
  const analyzedConcessions = concessions.map(concession => {
    // 1. Exact lot match
    const exactLotComplaint = complaints.find(
      c => c.customerId === customer.id &&
        c.lotNumber &&
        concession.lotNumber &&
        (c.lotNumber.toLowerCase().includes(concession.lotNumber.toLowerCase()) ||
         concession.lotNumber.toLowerCase().includes(c.lotNumber.toLowerCase()))
    );

    // 2. Same defect type claimed on or after the concession shipment date
    const sameDefectLaterComplaint = complaints.find(
      c => c.customerId === customer.id &&
        c.defectTypeId === concession.defectTypeId &&
        new Date(c.date) >= new Date(concession.date)
    );

    const relatedComplaint = exactLotComplaint || sameDefectLaterComplaint || (
      concession.customerFeedbackStatus === 'reclamado_posteriormente' ? complaints[0] : null
    );

    const isReclaimedLater = Boolean(
      concession.customerFeedbackStatus === 'reclamado_posteriormente' ||
      exactLotComplaint ||
      sameDefectLaterComplaint
    );

    return {
      ...concession,
      isReclaimedLater,
      relatedComplaint
    };
  });

  const totalConcessions = concessions.length;
  const reclaimedCount = analyzedConcessions.filter(c => c.isReclaimedLater).length;
  const successfulCount = totalConcessions - reclaimedCount;
  const successRate = totalConcessions > 0 ? Math.round((successfulCount / totalConcessions) * 100) : 100;

  const totalSaved = concessions.reduce((sum, c) => sum + (c.totalSavedValue || 0), 0);
  const reclaimedVolume = analyzedConcessions
    .filter(c => c.isReclaimedLater)
    .reduce((sum, c) => sum + c.quantity, 0);

  if (totalConcessions === 0) {
    return null;
  }

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/85 border border-slate-800/90 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Comparativo Cruzado: Enviado sob Concessão vs Reclamado
              </h3>
              {reclaimedCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  ⚠️ {reclaimedCount} Reclamação(ões) Pós-Envio
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✅ 100% Concessões Aceitas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Rastreabilidade de lotes liberados com desvios que foram aceitos ou que geraram SAC posterior
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Total Lotes Enviados</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
            {totalConcessions} <span className="text-xs text-slate-500 font-sans">lote(s)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Concessões Aceitas</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <span>{successfulCount}</span>
            <span className="text-xs font-semibold font-sans text-emerald-300/80">({successRate}%)</span>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          reclaimedCount > 0
            ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="text-[11px] opacity-80">Reclamados Posterior</div>
          <div className="text-lg font-bold font-mono mt-0.5 flex items-center gap-1">
            <span>{reclaimedCount} lote(s)</span>
            {reclaimedCount > 0 && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Scrap Salvo Efetivo</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Comparison Items List */}
      <div className="space-y-3">
        {analyzedConcessions.map((item, idx) => {
          return (
            <div
              key={item.id || idx}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                item.isReclaimedLater
                  ? 'bg-rose-950/25 border-rose-500/50 shadow-md shadow-rose-950/30'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Concession code, lot, date, status */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {item.code}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {item.productName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    (Lote: {item.lotNumber})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Enviado em: {new Date(item.date).toLocaleDateString('pt-BR')}
                  </span>

                  {item.isReclaimedLater ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Reclamado Posteriormente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Concessão Aceita 100%
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Defect info and volume */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Desvio Enviado: </span>
                  <strong className="text-slate-100">{item.defectTypeName}</strong>
                  <span className="text-slate-400 ml-2">({item.quantity.toLocaleString('pt-BR')} un concedidas)</span>
                </div>

                <div className="font-mono text-emerald-400 font-bold">
                  Scrap evitado: R$ {item.totalSavedValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Alert Callout if Reclaimed Later */}
              {item.isReclaimedLater && item.relatedComplaint && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <FileWarning className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Ocorrência Registrada Posteriormente no SAC do ERP:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-200/90">
                    O lote foi expedido com autorização de desvio, porém o cliente formalizou o chamado <strong>{item.relatedComplaint.code}</strong> em <strong>{new Date(item.relatedComplaint.date).toLocaleDateString('pt-BR')}</strong> apontando não-conformidade de <strong>{item.relatedComplaint.defectTypeName}</strong> ({item.relatedComplaint.quantityAffected?.toLocaleString('pt-BR')} kg afetados).
                  </p>
                  <p className="text-[10px] text-rose-300/80 font-mono italic">
                    Laudo SAC: "{item.relatedComplaint.description}"
                  </p>
                </div>
              )}

              {/* Success Callout if Accepted Cleanly */}
              {!item.isReclaimedLater && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300/90 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Lote consumido e faturado normalmente pelo cliente sem nenhum chamado aberto no ERP.</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
