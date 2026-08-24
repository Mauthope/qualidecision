'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import { Send, CheckCircle2, Clock, AlertTriangle, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';

export const RecentConcessionsTable: React.FC = () => {
  const { concessions } = useQuality();
  const [isNewConcessionOpen, setIsNewConcessionOpen] = useState(false);

  return (
    <>
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Últimos Envios com Concessão Registrados
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe os lotes liberados com desvios e o parecer de recebimento
              </p>
            </div>
          </div>

          <Link
            href="/envios"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            Ver todos ({concessions.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pr-4">Código / Data</th>
                <th className="pb-3 px-4">Cliente Destino</th>
                <th className="pb-3 px-4">Produto & Lote</th>
                <th className="pb-3 px-4">Defeito & Severidade</th>
                <th className="pb-3 px-4 text-right">Volume Concedido</th>
                <th className="pb-3 px-4 text-right">Scrap Salvo (R$)</th>
                <th className="pb-3 pl-4 text-center">Status / Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {concessions.slice(0, 6).map(item => {
                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Clock className="w-3 h-3" />
                    Em Trânsito
                  </span>
                );

                if (item.customerFeedbackStatus === 'aceito_sem_ressalvas') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Aceito sem queixa
                    </span>
                  );
                } else if (item.customerFeedbackStatus === 'aceito_com_observacao') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      Aceito c/ obs
                    </span>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors group">
                    <td className="py-3.5 pr-4">
                      <div className="font-mono font-bold text-cyan-400">{item.code}</div>
                      <div className="text-[11px] text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <Link href={`/clientes/${item.customerId}`} className="hover:text-cyan-300 transition-colors">
                        {item.customerName}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 truncate max-w-[180px]">{item.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">Lote: {item.lotNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-semibold">{item.defectTypeName}</div>
                      <span className={`text-[10px] uppercase font-bold ${
                        item.severity === 'severa' ? 'text-rose-400' : item.severity === 'moderada' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        Gravidade {item.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                      {item.quantity.toLocaleString('pt-BR')} un
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      R$ {item.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 pl-4 text-center">
                      {statusBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isNewConcessionOpen && (
        <NewConcessionModal isOpen={isNewConcessionOpen} onClose={() => setIsNewConcessionOpen(false)} />
      )}
    </>
  );
};
