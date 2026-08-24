'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import {
  Users,
  Search,
  ShieldCheck,
  AlertTriangle,
  Send,
  Bot,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin
} from 'lucide-react';
import { ConcessionDecisionModal } from '@/components/clientes/ConcessionDecisionModal';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { NewCustomerModal } from '@/components/clientes/NewCustomerModal';
import { Customer } from '@/types';
import { Plus } from 'lucide-react';

export default function ClientesPage() {
  const { customers, complaints, concessions, openAiDrawer } = useQuality();
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterTolerance, setFilterTolerance] = useState<string>('all');

  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [activeCustomerForDecision, setActiveCustomerForDecision] = useState<Customer | null>(null);
  const [activeCustomerForConcession, setActiveCustomerForConcession] = useState<string | null>(null);

  // Extract unique segments
  const segments = Array.from(new Set(customers.map(c => c.segment)));

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search);

    const matchesSegment = filterSegment === 'all' || c.segment === filterSegment;

    let matchesTolerance = true;
    if (filterTolerance === 'alta') matchesTolerance = c.overallToleranceScore >= 75;
    else if (filterTolerance === 'moderada') matchesTolerance = c.overallToleranceScore >= 50 && c.overallToleranceScore < 75;
    else if (filterTolerance === 'baixa') matchesTolerance = c.overallToleranceScore < 50;

    return matchesSearch && matchesSegment && matchesTolerance;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Catálogo & Radar de Tolerância de Clientes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Perfil de Tolerância a Defeitos & Histórico
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Consulte as exigências de cada cliente antes de expedir lotes com concessões e não-conformidades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do cliente, código ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterSegment}
            onChange={e => setFilterSegment(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none flex-1 md:flex-initial"
          >
            <option value="all">Todos os Segmentos</option>
            {segments.map((seg, idx) => (
              <option key={idx} value={seg}>{seg}</option>
            ))}
          </select>

          <select
            value={filterTolerance}
            onChange={e => setFilterTolerance(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none flex-1 md:flex-initial"
          >
            <option value="all">Toda Tolerância</option>
            <option value="alta">Alta Tolerância (&gt;75%)</option>
            <option value="moderada">Moderada (50-74%)</option>
            <option value="baixa">Baixa / Intolerante (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCustomers.map(customer => {
          const clientComplaints = complaints.filter(c => c.customerId === customer.id);
          const clientConcessions = concessions.filter(c => c.customerId === customer.id);

          let scoreBadgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
          let scoreText = 'Alta Flexibilidade';
          if (customer.overallToleranceScore < 50) {
            scoreBadgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            scoreText = 'Rígido / Baixa Tolerância';
          } else if (customer.overallToleranceScore < 75) {
            scoreBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
            scoreText = 'Tolerância Moderada';
          }

          return (
            <div
              key={customer.id}
              className="glow-card p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${customer.avatarColor} p-0.5 shadow-md flex items-center justify-center font-bold text-white text-base font-heading shrink-0`}>
                    {customer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="font-bold text-white hover:text-cyan-300 text-sm sm:text-base transition-colors line-clamp-1"
                    >
                      {customer.name}
                    </Link>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-cyan-400" />
                      <span className="truncate">{customer.segment}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${scoreBadgeColor}`}>
                    {customer.overallToleranceScore}%
                  </span>
                </div>
              </div>

              {/* Quick Info & Address */}
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{customer.cityState}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">{customer.code}</span>
              </div>

              {/* Stats Box */}
              {(() => {
                const totalKg = clientComplaints.reduce((sum, c) => sum + (c.quantityAffected || 0), 0);
                return (
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px]">Reclamações:</div>
                      <div className="font-bold font-mono text-rose-400 text-sm mt-0.5">
                        {clientComplaints.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Peso Afetado:</div>
                      <div className="font-bold font-mono text-amber-400 text-sm mt-0.5">
                        {totalKg > 0 ? `${totalKg.toLocaleString('pt-BR')} kg` : '0 kg'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Concessões:</div>
                      <div className="font-bold font-mono text-cyan-400 text-sm mt-0.5">
                        {clientConcessions.length}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <button
                  onClick={() => setActiveCustomerForDecision(customer)}
                  className="flex items-center gap-1.5 font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Simular Risco
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCustomerForConcession(customer.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                  >
                    + Envio
                  </button>

                  <Link
                    href={`/clientes/${customer.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Perfil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Simulation Modal */}
      {activeCustomerForDecision && (
        <ConcessionDecisionModal
          isOpen={!!activeCustomerForDecision}
          customer={activeCustomerForDecision}
          onClose={() => setActiveCustomerForDecision(null)}
        />
      )}

      {/* New Concession Modal */}
      {activeCustomerForConcession && (
        <NewConcessionModal
          isOpen={!!activeCustomerForConcession}
          defaultCustomerId={activeCustomerForConcession}
          onClose={() => setActiveCustomerForConcession(null)}
        />
      )}

      {/* New Customer Modal */}
      {isNewCustomerModalOpen && (
        <NewCustomerModal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
        />
      )}
    </div>
  );
}
