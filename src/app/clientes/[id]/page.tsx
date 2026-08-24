'use client';

import React, { use } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { CustomerProfileHeader } from '@/components/clientes/CustomerProfileHeader';
import { ToleranceMatrix } from '@/components/clientes/ToleranceMatrix';
import { CustomerComplaintHistory } from '@/components/clientes/CustomerComplaintHistory';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { customers, defects, complaints, concessions } = useQuality();

  const customer = customers.find(c => c.id === resolvedParams.id);

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Cliente não encontrado</h2>
        <p className="text-xs text-slate-400">O identificador informado não consta na base de dados.</p>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Clientes
        </Link>
      </div>
    );
  }

  const clientComplaints = complaints.filter(c => c.customerId === customer.id);
  const clientConcessions = concessions.filter(c => c.customerId === customer.id);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Clientes
        </Link>
      </div>

      {/* Profile Header */}
      <CustomerProfileHeader
        customer={customer}
        complaints={clientComplaints}
        concessions={clientConcessions}
      />

      {/* Tolerance Matrix */}
      <ToleranceMatrix
        customer={customer}
        defects={defects}
        complaints={clientComplaints}
      />

      {/* Historical Complaints & Photos */}
      <CustomerComplaintHistory
        customer={customer}
        complaints={clientComplaints}
      />

      {/* Customer Concessions Log */}
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              Histórico de Lotes Concedidos Enviados a Este Cliente
            </h3>
            <p className="text-xs text-slate-400">
              Registros de despachos com desvios liberados para {customer.name}
            </p>
          </div>
        </div>

        {clientConcessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Nenhuma concessão enviada para este cliente até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5 pr-4">Código / Data</th>
                  <th className="pb-2.5 px-4">Lote & Produto</th>
                  <th className="pb-2.5 px-4">Defeito Concedido</th>
                  <th className="pb-2.5 px-4 text-right">Volume</th>
                  <th className="pb-2.5 px-4 text-right">Scrap Salvo</th>
                  <th className="pb-2.5 pl-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {clientConcessions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/50">
                    <td className="py-3 pr-4">
                      <span className="font-mono font-bold text-cyan-400">{c.code}</span>
                      <div className="text-[11px] text-slate-500">{new Date(c.date).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{c.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">Lote: {c.lotNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{c.defectTypeName}</span>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">{c.severity}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                      {c.quantity.toLocaleString('pt-BR')} un
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      R$ {c.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pl-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.customerFeedbackStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
