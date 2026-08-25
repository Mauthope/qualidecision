'use client';

import React, { use, useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Send,
  AlertCircle,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CustomerProfileHeader } from '@/components/clientes/CustomerProfileHeader';
import { ToleranceMatrix } from '@/components/clientes/ToleranceMatrix';
import { CustomerComplaintHistory } from '@/components/clientes/CustomerComplaintHistory';
import { CustomerConcessionsHistory } from '@/components/clientes/CustomerConcessionsHistory';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { customers, defects, complaints, concessions } = useQuality();
  const [activeTab, setActiveTab] = useState<'all' | 'matrix' | 'concessions' | 'complaints'>('all');

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

  // Distinct claimed defects count
  const claimedDefectIds = new Set(clientComplaints.map(c => c.defectTypeId));
  const claimedCount = claimedDefectIds.size;

  // Check how many concessions were reclaimed after shipment
  const reclaimedConcessionsCount = clientConcessions.filter(c =>
    c.customerFeedbackStatus === 'reclamado_posteriormente' ||
    clientComplaints.some(
      comp => comp.defectTypeId === c.defectTypeId && new Date(comp.date) >= new Date(c.date)
    )
  ).length;

  return (
    <div className="space-y-8">
      
      {/* Top Bar: Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Clientes
        </Link>
      </div>

      {/* 1. Main Profile Header */}
      <CustomerProfileHeader
        customer={customer}
        complaints={clientComplaints}
        concessions={clientConcessions}
      />

      {/* 2. Interactive Section Switcher / Tab Navigation */}
      <div className="sticky top-16 z-30 py-2.5 px-3 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-xl shadow-black/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab: All */}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Visão Geral Completa</span>
          </button>

          {/* Tab: Tolerance Matrix */}
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Matriz de Tolerância</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {claimedCount} reclamados
            </span>
          </button>

          {/* Tab: Concessions History */}
          <button
            onClick={() => setActiveTab('concessions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'concessions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Envios / Concessões</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono border ${
              reclaimedConcessionsCount > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {clientConcessions.length}
            </span>
          </button>

          {/* Tab: Complaints */}
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Reclamações SAC</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {clientComplaints.length}
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
          <span>Seções organizadas por módulo</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: MATRIZ DE TOLERÂNCIA POR TIPO DE DEFEITO */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'matrix') && (
        <section className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm">
                1
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-heading flex items-center gap-2">
                  <span>Matriz de Tolerância Técnica por Defeito</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Diretrizes
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Consulte os desvios aceitos e as restrições operacionais configuradas para este cliente.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-1 bg-gradient-to-b from-cyan-500/20 via-slate-800/40 to-transparent">
            <ToleranceMatrix
              customer={customer}
              defects={defects}
              complaints={clientComplaints}
            />
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: HISTÓRICO DE ENVIOS COM CONCESSÃO */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'concessions') && (
        <section className="space-y-3 relative pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
                2
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-heading flex items-center gap-2">
                  <span>Histórico de Lotes Concedidos Enviados</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {clientConcessions.length} Lote(s) Expedido(s)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Lotes expedidos com aprovação de desvio e monitoramento de aceitação pós-entrega.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-1 bg-gradient-to-b from-emerald-500/20 via-slate-800/40 to-transparent">
            <CustomerConcessionsHistory
              customer={customer}
              concessions={clientConcessions}
              complaints={clientComplaints}
            />
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: HISTÓRICO DE RECLAMAÇÕES & NÃO-CONFORMIDADES */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'complaints') && (
        <section className="space-y-3 relative pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold font-mono text-sm">
                3
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-heading flex items-center gap-2">
                  <span>Histórico de Reclamações & Não-Conformidades (SAC)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {clientComplaints.length} Ocorrência(s)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Chamados abertos pelo cliente, laudos técnicos, causas raízes apuradas e evidências fotográficas.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-1 bg-gradient-to-b from-rose-500/20 via-slate-800/40 to-transparent">
            <CustomerComplaintHistory
              customer={customer}
              complaints={clientComplaints}
            />
          </div>
        </section>
      )}

    </div>
  );
}

