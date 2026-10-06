'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, AlertTriangle, ArrowRight } from 'lucide-react';

export interface CustomerConcessionRank {
  customerId: string;
  customerName: string;
  totalUnits: number;
  totalAmount: number;
  count: number;
}

export interface CustomerComplaintRank {
  customerId: string;
  customerName: string;
  count: number;
  totalWeight: number;
}

interface TopCustomersTableProps {
  type: 'concessoes' | 'reclamacoes';
  concessionCustomers?: CustomerConcessionRank[];
  complaintCustomers?: CustomerComplaintRank[];
  totalSaved?: number;
  totalComplaintsCount?: number;
  hasActiveFilters: boolean;
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
  type,
  concessionCustomers = [],
  complaintCustomers = [],
  totalSaved = 0,
  totalComplaintsCount = 0,
  hasActiveFilters
}) => {
  const isConcession = type === 'concessoes';

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isConcession ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isConcession ? <Layers className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              {isConcession
                ? `Ranking de Clientes por Concessões ${hasActiveFilters ? '(Filtrado)' : ''}`
                : `Ranking de Clientes por SAC ${hasActiveFilters ? '(Filtrado)' : ''}`}
            </h3>
            <p className="text-xs text-slate-400">
              {isConcession
                ? 'Parceiros com maior volume de absorção de materiais'
                : 'Empresas com maior incidência de não-conformidades'}
            </p>
          </div>
        </div>

        <Link
          href="/clientes"
          className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
            isConcession ? 'text-cyan-400 hover:text-cyan-300' : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          <span>Ver Clientes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <th className="pb-2.5 pr-4">Posição / Cliente</th>
              <th className="pb-2.5 px-4 text-right">{isConcession ? 'Volume' : 'Ocorrências'}</th>
              <th className="pb-2.5 px-4 text-right">{isConcession ? 'Valor Salvo' : 'Peso (Kg)'}</th>
              <th className="pb-2.5 pl-4 text-right">{isConcession ? '% Total' : '% SAC'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isConcession ? (
              concessionCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Nenhum cliente com concessões no filtro selecionado.
                  </td>
                </tr>
              ) : (
                concessionCustomers.slice(0, 6).map((item, idx) => {
                  const percent = totalSaved > 0 ? (item.totalAmount / totalSaved) * 100 : 0;
                  return (
                    <tr key={item.customerId} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-4 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs shrink-0">
                          #{idx + 1}
                        </span>
                        <Link
                          href={`/clientes/${item.customerId}`}
                          className="font-bold text-slate-100 hover:text-cyan-300 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
                        >
                          {item.customerName}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                        {item.totalUnits.toLocaleString('pt-BR')} un
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </td>

                      <td className="py-3 pl-4 text-right font-mono text-cyan-400 font-semibold">
                        {percent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )
            ) : (
              complaintCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Nenhuma reclamação encontrada para o filtro ativo.
                  </td>
                </tr>
              ) : (
                complaintCustomers.slice(0, 6).map((item, idx) => {
                  const pct = totalComplaintsCount > 0 ? (item.count / totalComplaintsCount) * 100 : 0;
                  return (
                    <tr key={item.customerId} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-4 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-rose-400 text-xs shrink-0">
                          #{idx + 1}
                        </span>
                        <Link
                          href={`/clientes/${item.customerId}`}
                          className="font-bold text-slate-100 hover:text-rose-300 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
                        >
                          {item.customerName}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {item.count} chamado{item.count > 1 ? 's' : ''}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {item.totalWeight.toLocaleString('pt-BR')} kg
                      </td>

                      <td className="py-3 pl-4 text-right font-mono text-slate-300 font-semibold">
                        {pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
