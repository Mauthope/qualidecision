'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie
} from 'recharts';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  PackageCheck,
  ShieldCheck,
  Download,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function IndicadoresPage() {
  const { stats, concessions, customers, showToast } = useQuality();
  const [period, setPeriod] = useState('month');

  // Defect breakdown data
  const defectData = Object.values(stats.defectsVolumeMonth)
    .filter(d => d.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const totalUnits = defectData.reduce((acc, c) => acc + c.quantity, 0);
  const totalSaved = defectData.reduce((acc, c) => acc + c.amount, 0);

  // Pie chart data
  const pieData = defectData.map(d => ({
    name: d.name,
    value: d.amount,
    color: d.color
  }));

  const exportSummary = () => {
    showToast('Relatório executivo de lucratividade gerado!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Indicadores de Lucratividade & Volume de Desvios</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Monitoramento de Concessões & Scrap Evitado
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe o volume expedido por tipo de defeito (ex: 10k Vinco, 5k Borrão) e a rentabilidade do projeto.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="month">Mês Atual (Agosto/2026)</option>
            <option value="quarter">Trimestre Atual (Q3/2026)</option>
            <option value="year">Ano de 2026</option>
          </select>

          <button
            onClick={exportSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Relatório</span>
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glow-card p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Volume Total Concedido</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-300">
            {totalUnits.toLocaleString('pt-BR')} <span className="text-xs font-sans font-normal text-slate-400">un</span>
          </div>
          <p className="text-[11px] text-slate-400">Sacarias/Bags salvos de virar refugo</p>
        </div>

        <div className="glow-card p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Lucro Salvo (Scrap Evitado)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">Valor recuperado diretamente</p>
        </div>

        <div className="glow-card p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Valor Médio Recuperado</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-teal-300">
            R$ {totalUnits > 0 ? (totalSaved / totalUnits).toFixed(2) : '0.00'} <span className="text-xs font-sans font-normal text-slate-400">/unidade</span>
          </div>
          <p className="text-[11px] text-slate-400">Média ponderada por sacaria</p>
        </div>

        <div className="glow-card p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Taxa de Aceite Técnico</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-300">
            {stats.acceptanceRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400">Sem retorno ou queixa posterior</p>
        </div>
      </div>

      {/* Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Volume por Defeito */}
        <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Volume de Unidades Expedidas por Tipo de Defeito (Mês)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              Total: {totalUnits.toLocaleString('pt-BR')} un
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-xl text-xs space-y-1">
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-cyan-400 font-mono">Volume: {item.quantity.toLocaleString('pt-BR')} un</div>
                          <div className="text-emerald-400 font-mono">Scrap Salvo: R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="quantity" radius={[8, 8, 0, 0]}>
                  {defectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Distribuição Financeira */}
        <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-heading">
                Composição do Valor Salvo
              </h3>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Mini Legend */}
          <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar pt-2 border-t border-slate-800/60">
            {defectData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold shrink-0">
                  R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers Ranking for Concessions */}
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Ranking de Clientes por Volume de Concessões Aceitas
              </h3>
              <p className="text-xs text-slate-400">
                Parceiros com maior volume de absorção de materiais com desvio controlado
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <th className="pb-2.5 pr-4">Posição / Cliente</th>
                <th className="pb-2.5 px-4 text-right">Volume Concedido</th>
                <th className="pb-2.5 px-4 text-right">Valor Preservado (R$)</th>
                <th className="pb-2.5 pl-4 text-right">% do Total Salvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.topCustomersConcessions.map((item, idx) => {
                const percent = totalSaved > 0 ? (item.totalAmount / totalSaved) * 100 : 0;
                return (
                  <tr key={item.customerId} className="hover:bg-slate-900/50">
                    <td className="py-3 pr-4 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-100">{item.customerName}</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                      {item.totalUnits.toLocaleString('pt-BR')} un
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 pl-4 text-right font-mono text-cyan-400 font-semibold">
                      {percent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
