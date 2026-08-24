'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import { Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';

export const QuickToleranceGrid: React.FC = () => {
  const { customers, complaints, concessions } = useQuality();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isConcessionOpen, setIsConcessionOpen] = useState(false);

  return (
    <>
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Radar de Tolerância & Perfil de Clientes
              </h3>
              <p className="text-xs text-slate-400">
                Monitore o perfil de exigência técnica e histórico de cada parceiro
              </p>
            </div>
          </div>

          <Link
            href="/clientes"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            Ver todos ({customers.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map(customer => {
            const customerComplaints = complaints.filter(c => c.customerId === customer.id);
            const customerConcessions = concessions.filter(c => c.customerId === customer.id);

            // Tolerance badge style
            let scoreBadgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            if (customer.overallToleranceScore < 50) {
              scoreBadgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            } else if (customer.overallToleranceScore < 75) {
              scoreBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
            }

            return (
              <div
                key={customer.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3.5"
              >
                {/* Top: Avatar & Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${customer.avatarColor} p-0.5 shadow-md flex items-center justify-center font-bold text-white text-sm`}>
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/clientes/${customer.id}`}
                        className="font-bold text-slate-100 hover:text-cyan-300 text-xs sm:text-sm transition-colors line-clamp-1"
                      >
                        {customer.name}
                      </Link>
                      <div className="text-[11px] text-slate-400">{customer.segment}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${scoreBadgeColor} shrink-0`}>
                    Score: {customer.overallToleranceScore}%
                  </span>
                </div>

                {/* Tolerance highlights */}
                <div className="space-y-1.5 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Reclamações ERP:</span>
                    <span className="font-bold text-rose-400">{customerComplaints.length} registradas</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Concessões Recebidas:</span>
                    <span className="font-bold text-cyan-400">{customerConcessions.length} lotes</span>
                  </div>
                  
                  {/* Defect tolerance sample */}
                  <div className="pt-1 text-[11px] text-slate-300 border-t border-slate-800/80 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      {customer.id === 'cli-alisul' ? 'Tolera Vinco leve | Intolerante em Costura' :
                       customer.id === 'cli-yara' ? 'Altíssima tolerância visual em Big Bags' :
                       customer.id === 'cli-jbs' ? 'Norma sanitária: Zero tolerância a Mancha' :
                       'Perfil catalogado no matriz de decisão'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {customer.code}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setIsConcessionOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      + Concessão
                    </button>
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors flex items-center gap-1 text-[11px] font-medium"
                      title="Ver Perfil Completo"
                    >
                      <span>Detalhes</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isConcessionOpen && selectedCustomerId && (
        <NewConcessionModal
          isOpen={isConcessionOpen}
          defaultCustomerId={selectedCustomerId}
          onClose={() => {
            setIsConcessionOpen(false);
            setSelectedCustomerId(null);
          }}
        />
      )}
    </>
  );
};
