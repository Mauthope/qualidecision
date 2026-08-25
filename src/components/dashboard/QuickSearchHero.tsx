'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import {
  Search,
  Send,
  AlertCircle,
  Sparkles,
  User,
  Package,
  X
} from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';

export const QuickSearchHero: React.FC = () => {
  const { customers, complaints, concessions, searchQuery, setSearchQuery } = useQuality();
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);

  // Filtered Results for Quick Dropdown
  const searchLower = searchQuery.toLowerCase().trim();

  const matchingCustomers = searchLower
    ? customers.filter(c => c.name.toLowerCase().includes(searchLower) || c.code.toLowerCase().includes(searchLower))
    : [];

  const matchingComplaints = searchLower
    ? complaints.filter(c => c.customerName.toLowerCase().includes(searchLower) || c.lotNumber.toLowerCase().includes(searchLower) || c.defectTypeName.toLowerCase().includes(searchLower))
    : [];

  const matchingConcessions = searchLower
    ? concessions.filter(c => c.customerName.toLowerCase().includes(searchLower) || c.lotNumber.toLowerCase().includes(searchLower) || c.defectTypeName.toLowerCase().includes(searchLower))
    : [];

  const hasResults = searchLower && (matchingCustomers.length > 0 || matchingComplaints.length > 0 || matchingConcessions.length > 0);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-slate-800/90 p-5 sm:p-7 shadow-2xl">
        
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-1/4 w-80 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header text */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Central de Decisão de Qualidade & Tolerância</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
                Decida com segurança a liberação de lotes com <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">concessões e desvios</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
                Consulte o histórico de não-conformidades de cada cliente, analise o perfil de tolerância a defeitos e registre envios com scrap evitado.
              </p>
            </div>

            {/* Action Button: Apenas o Envio com Desvio */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsConcessionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Novo Envio com Desvio</span>
              </button>
            </div>
          </div>

          {/* Search Box with instant results dropdown */}
          <div className="relative">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquise por cliente (ex: Alisul, Bunge, Copacol), número de lote (LT-2026-884) ou tipo de defeito (vinco, borrão)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
              />
            </div>

            {/* Quick Customer Fast-Filter Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Clientes frequentes:</span>
              {customers.slice(0, 5).map(c => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${c.avatarColor}`} />
                  <span>{c.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500">({c.overallToleranceScore}%)</span>
                </Link>
              ))}
            </div>

            {/* Instant Search Results Dropdown */}
            {hasResults && (
              <div className="absolute top-full mt-2 left-0 right-0 z-30 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                {/* Customers */}
                {matchingCustomers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      Clientes Encontrados ({matchingCustomers.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {matchingCustomers.map(c => (
                        <Link
                          key={c.id}
                          href={`/clientes/${c.id}`}
                          onClick={() => setSearchQuery('')}
                          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{c.name}</div>
                            <div className="text-[11px] text-slate-400">{c.segment}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Tolerância {c.overallToleranceScore}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complaints */}
                {matchingComplaints.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      Reclamações do ERP ({matchingComplaints.length})
                    </div>
                    <div className="space-y-1.5">
                      {matchingComplaints.map(complaint => (
                        <div key={complaint.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-rose-300 mr-2">[{complaint.code}]</span>
                            <span className="text-slate-200">{complaint.customerName} - Lote {complaint.lotNumber}</span>
                            <div className="text-[11px] text-slate-400">{complaint.defectTypeName}: "{complaint.description.slice(0, 70)}..."</div>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">{new Date(complaint.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isConcessionModalOpen && (
        <NewConcessionModal isOpen={isConcessionModalOpen} onClose={() => setIsConcessionModalOpen(false)} />
      )}
    </>
  );
};
