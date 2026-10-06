'use client';

import React from 'react';
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
import { BarChart3, DollarSign, AlertCircle } from 'lucide-react';

interface DefectChartItem {
  name: string;
  quantity: number;
  amount: number;
  color: string;
}

interface PieChartItem {
  name: string;
  value: number;
  color: string;
}

interface ConcessionsChartsProps {
  defectData: DefectChartItem[];
  pieData: PieChartItem[];
  totalUnits: number;
  totalSaved: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const ConcessionsCharts: React.FC<ConcessionsChartsProps> = ({
  defectData,
  pieData,
  totalUnits,
  totalSaved,
  hasActiveFilters,
  onResetFilters
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Bar Chart: Volume por Defeito */}
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Volume por Tipo de Desvio {hasActiveFilters && '(Filtrado)'}
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                Distribuição quantitativa de peças com desvio controlado
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Total: {totalUnits.toLocaleString('pt-BR')} un
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {defectData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-6 text-center">
              <AlertCircle className="w-7 h-7 text-slate-600 mb-1" />
              <span className="font-semibold text-slate-300">Nenhum desvio registrado para os filtros selecionados.</span>
              <span className="text-[11px] text-slate-500">Tente redefinir o período ou alterar os termos de busca.</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-all cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectData} margin={{ top: 12, right: 10, left: -5, bottom: 25 }}>
                <defs>
                  {defectData.map((entry, index) => (
                    <linearGradient key={`bar-grad-${index}`} id={`bar-grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.55} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(v: string) => (v.length > 13 ? `${v.slice(0, 11)}…` : v)}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as DefectChartItem;
                      const pct = totalUnits > 0 ? ((item.quantity / totalUnits) * 100).toFixed(1) : '0';
                      return (
                        <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[190px]">
                          <div className="flex items-center gap-2 font-bold text-white text-sm pb-1 border-b border-slate-800/80">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 font-mono">
                            <span className="text-slate-400">Volume:</span>
                            <span className="font-bold text-white">
                              {item.quantity.toLocaleString('pt-BR')} un
                              <span className="text-slate-400 font-normal ml-1">({pct}%)</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">Scrap Salvo:</span>
                            <span className="font-bold text-emerald-400">
                              R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="quantity" radius={[7, 7, 0, 0]}>
                  {defectData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#bar-grad-${index})`}
                      stroke={entry.color}
                      strokeWidth={1}
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Donut Chart: Composição do Scrap Salvo */}
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Composição do Scrap
              </h3>
              <p className="text-[11px] text-slate-400">
                {defectData.length} tipo{defectData.length !== 1 ? 's' : ''} no filtro
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
            100%
          </span>
        </div>

        <div className="h-52 w-full flex items-center justify-center relative">
          {pieData.length === 0 ? (
            <div className="text-slate-500 text-xs">Sem dados financeiros no filtro ativo</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#020617"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as PieChartItem;
                        const pct = totalSaved > 0 ? ((item.value / totalSaved) * 100).toFixed(1) : '0';
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1 backdrop-blur-md min-w-[170px]">
                            <div className="flex items-center gap-2 font-bold text-white truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <div className="text-emerald-400 font-mono font-bold text-sm">
                              R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {pct}% do total recuperado
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Total Salvo
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  R$ {totalSaved >= 1000 ? `${(totalSaved / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : totalSaved.toFixed(0)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {totalUnits.toLocaleString('pt-BR')} un
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-1 text-xs max-h-36 overflow-y-auto custom-scrollbar pt-2 border-t border-slate-800/60">
          {defectData.map((item, idx) => {
            const pct = totalSaved > 0 ? ((item.amount / totalSaved) * 100).toFixed(1) : '0';
            return (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] hover:bg-slate-900/60 px-1.5 py-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300 truncate font-medium" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">
                    {pct}%
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
