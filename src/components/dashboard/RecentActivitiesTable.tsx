'use client';

import React from 'react';
import Link from 'next/link';
import { Send, AlertCircle, ArrowRight, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Concession, Complaint } from '@/types';

interface RecentActivitiesTableProps {
  type: 'concessoes' | 'reclamacoes';
  concessions?: Concession[];
  complaints?: Complaint[];
  allComplaints?: Complaint[];
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const RecentActivitiesTable: React.FC<RecentActivitiesTableProps> = ({
  type,
  concessions = [],
  complaints = [],
  allComplaints = [],
  totalCount,
  hasActiveFilters,
  onResetFilters
}) => {
  const isConcession = type === 'concessoes';

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isConcession ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isConcession ? <Send className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              {isConcession ? 'Últimos Envios com Concessão' : 'Últimas Reclamações de Clientes'}
            </h3>
            <p className="text-xs text-slate-400">
              {isConcession
                ? `Lotes liberados com desvio controlado (${concessions.length} no filtro)`
                : `Histórico de laudos e queixas de SAC (${complaints.length} no filtro)`}
            </p>
          </div>
        </div>

        <Link
          href={isConcession ? '/envios' : '/reclamacoes'}
          className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
            isConcession ? 'text-cyan-400 hover:text-cyan-300' : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          <span>Ver Histórico Completo ({totalCount})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <th className="pb-2.5 pr-3">{isConcession ? 'Fardo(s) / Data' : 'Código / Data'}</th>
              <th className="pb-2.5 px-3">Cliente</th>
              <th className="pb-2.5 px-3">Desvio</th>
              <th className="pb-2.5 px-3 text-right">{isConcession ? 'Volume' : 'Peso (Kg)'}</th>
              <th className="pb-2.5 pl-3 text-center">{isConcession ? 'Status' : 'Gravidade'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isConcession ? (
              concessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-300">Nenhum envio encontrado para os filtros aplicados.</p>
                    <p className="text-[11px] text-slate-500">Tente ajustar o intervalo de datas ou remover filtros restritivos.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-colors cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                concessions.slice(0, 6).map(item => {
                  const isReclaimed = allComplaints.some(
                    comp =>
                      comp.customerId === item.customerId &&
                      (((comp.lotNumber && item.lotNumber && comp.lotNumber.toLowerCase().includes(item.lotNumber.toLowerCase())) ||
                        (comp.bales && item.bales && comp.bales.some(b => item.bales?.includes(b)))) ||
                        (comp.defectTypeId === item.defectTypeId && new Date(comp.date) >= new Date(item.date)))
                  ) || item.customerFeedbackStatus === 'reclamado_posteriormente';

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Clock className="w-3 h-3" />
                      Em Trânsito
                    </span>
                  );

                  if (isReclaimed) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Reclamado
                      </span>
                    );
                  } else if (item.customerFeedbackStatus === 'aceito_sem_ressalvas') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Aceito
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-3">
                        <div className="font-mono font-bold text-cyan-400">
                          {item.bales && item.bales.length > 0
                            ? `Fardo${item.bales.length > 1 ? 's' : ''} ${item.bales.slice(0, 2).join(', ')}${item.bales.length > 2 ? '...' : ''}`
                            : (item.lotNumber || item.code)}
                        </div>
                        <div className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-200 truncate max-w-[130px]">
                        {item.customerName}
                      </td>

                      <td className="py-3 px-3 text-slate-300 truncate max-w-[120px]">
                        {item.defectTypeName}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                        {item.quantity.toLocaleString('pt-BR')} un
                      </td>

                      <td className="py-3 pl-3 text-center">
                        {statusBadge}
                      </td>
                    </tr>
                  );
                })
              )
            ) : (
              complaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-300">Nenhuma reclamação corresponde aos filtros aplicados.</p>
                    <p className="text-[11px] text-slate-500">Tente ajustar o intervalo de datas ou remover filtros restritivos.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-colors cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                complaints.slice(0, 6).map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="py-3 pr-3">
                      <div className="font-mono font-bold text-rose-400">{item.code}</div>
                      <div className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {item.customerName}
                      </div>
                      {item.opNumber && (
                        <div className="text-[10px] font-mono font-bold text-cyan-300">
                          OP: {item.opNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-300 truncate max-w-[120px]">
                      {item.defectTypeName}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      {item.quantityAffected?.toLocaleString('pt-BR')} kg
                    </td>

                    <td className="py-3 pl-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.severity === 'severa'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.severity === 'moderada'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
