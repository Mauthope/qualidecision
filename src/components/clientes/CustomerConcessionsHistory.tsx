'use client';

import React from 'react';
import { Customer, Complaint, ConcessionShipment } from '@/types';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileWarning,
  ShieldCheck,
  Package,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface Props {
  customer: Customer;
  concessions: ConcessionShipment[];
  complaints: Complaint[];
}

export const CustomerConcessionsHistory: React.FC<Props> = ({
  customer,
  concessions,
  complaints
}) => {
  // Map concessions and check if there are complaints from the shipment date onwards
  const analyzedConcessions = concessions.map(c => {
    const shipmentDate = new Date(c.date);

    // Find any complaint by this customer for the SAME defect on or after the shipment date
    const sameDefectLaterComplaint = complaints.find(comp => {
      if (comp.customerId !== customer.id) return false;
      const compDate = new Date(comp.date);
      // Same defect type AND complaint date is on or after the concession shipment date
      return comp.defectTypeId === c.defectTypeId && compDate >= shipmentDate;
    });

    // Or exact lot match
    const lotMatchComplaint = complaints.find(comp => {
      if (comp.customerId !== customer.id || !comp.lotNumber || !c.lotNumber) return false;
      return (
        comp.lotNumber.toLowerCase().includes(c.lotNumber.toLowerCase()) ||
        c.lotNumber.toLowerCase().includes(comp.lotNumber.toLowerCase())
      );
    });

    const subsequentComplaint = sameDefectLaterComplaint || lotMatchComplaint || (
      c.customerFeedbackStatus === 'reclamado_posteriormente' ? complaints.find(comp => comp.customerId === customer.id) : null
    );

    const isReclaimedAfterShipment = Boolean(
      c.customerFeedbackStatus === 'reclamado_posteriormente' ||
      sameDefectLaterComplaint ||
      lotMatchComplaint
    );

    return {
      ...c,
      isReclaimedAfterShipment,
      subsequentComplaint
    };
  });

  const totalConcessions = concessions.length;
  const reclaimedCount = analyzedConcessions.filter(c => c.isReclaimedAfterShipment).length;
  const successfulCount = totalConcessions - reclaimedCount;

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/85 border border-slate-800/90 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Histórico de Lotes Concedidos Enviados a Este Cliente
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {totalConcessions} Envio(s)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rastreamento de lotes liberados com concessão e monitoramento de reclamações pós-envio
            </p>
          </div>
        </div>

        {/* Quick summary counters */}
        <div className="flex items-center gap-2 text-xs">
          {reclaimedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{reclaimedCount} Reclamado(s) Pós-Envio</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{successfulCount} Aceito(s) sem Queixa</span>
          </span>
        </div>
      </div>

      {/* List of Concessions Blocks */}
      {totalConcessions === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
          Nenhuma concessão enviada para este cliente até o momento.
        </div>
      ) : (
        <div className="space-y-4">
          {analyzedConcessions.map((item, idx) => {
            const isReclaimed = item.isReclaimedAfterShipment;
            const complaint = item.subsequentComplaint;

            return (
              <div
                key={item.id || idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 ${
                  isReclaimed
                    ? 'bg-rose-950/30 border-2 border-rose-500/70 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                    : 'bg-slate-900/50 border border-emerald-500/40 hover:border-emerald-500/60'
                }`}
              >
                {/* Block Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        isReclaimed
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {item.code}
                    </span>

                    <span className="text-sm font-bold text-white">
                      {item.productName}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      (Lote: {item.lotNumber})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Data de Envio: <strong className="text-slate-200">{new Date(item.date).toLocaleDateString('pt-BR')}</strong>
                    </span>

                    {isReclaimed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-900/50 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                        RECLAMADO APÓS ENVIO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        CONCESSÃO ACEITA (SEM RECLAMAÇÃO)
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Desvio Concedido:</span>
                    <strong className="text-slate-100 text-xs mt-0.5 block">{item.defectTypeName}</strong>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">{item.severity}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Volume Concedido:</span>
                    <strong className="font-mono text-cyan-400 text-xs mt-0.5 block">
                      {item.quantity.toLocaleString('pt-BR')} un
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Scrap Salvo Estimado:</span>
                    <strong className="font-mono text-emerald-400 text-xs mt-0.5 block">
                      R$ {item.totalSavedValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Liberado Por:</span>
                    <span className="text-slate-300 text-xs mt-0.5 block truncate">{item.approvedBy}</span>
                  </div>
                </div>

                {/* Technical notes */}
                {item.technicalNotes && (
                  <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 font-semibold">Parecer da Liberação: </span>
                    {item.technicalNotes}
                  </div>
                )}

                {/* CONDITIONAL CALLOUT: RED IF RECLAIMED AFTER SHIPMENT */}
                {isReclaimed && complaint ? (
                  <div className="p-4 rounded-xl bg-rose-950/50 border-2 border-rose-500/60 text-xs text-rose-100 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                      <FileWarning className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>🚨 AVISO: Reclamação aberta pelo cliente a partir da data de envio!</span>
                    </div>

                    <p className="text-xs leading-relaxed text-rose-200/95">
                      Este lote foi expedido em <strong>{new Date(item.date).toLocaleDateString('pt-BR')}</strong> com aprovação de desvio de <strong>{item.defectTypeName}</strong>.
                      No entanto, em <strong>{new Date(complaint.date).toLocaleDateString('pt-BR')}</strong> (posterior ao envio), o cliente registrou formalmente o chamado <strong>{complaint.code}</strong> no SAC do ERP para o mesmo desvio de <strong>{complaint.defectTypeName}</strong> ({complaint.quantityAffected ? `${complaint.quantityAffected.toLocaleString('pt-BR')} kg` : 'peso sob análise'} afetados).
                    </p>

                    <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/30 text-[11px] font-mono text-rose-300 italic">
                      Laudo do SAC no ERP: "{complaint.description}"
                    </div>
                  </div>
                ) : !isReclaimed ? (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Concessão Bem-Sucedida:</strong> Nenhuma reclamação de <strong>{item.defectTypeName}</strong> foi aberta pelo cliente após a data de envio (<strong>{new Date(item.date).toLocaleDateString('pt-BR')}</strong>). Material faturado e absorvido sem queixas.
                    </span>
                  </div>
                ) : null}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
