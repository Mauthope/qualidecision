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
import { BarChart3, AlertTriangle, AlertCircle } from 'lucide-react';

interface ComplaintDefectItem {
  name: string;
  count: number;
  totalWeight: number;
  color: string;
}

interface SeverityItem {
  name: string;
  value: number;
  color: string;
}

interface ComplaintsChartsProps {
  complaintDefectData: ComplaintDefectItem[];
  complaintSeverityData: SeverityItem[];
  totalComplaintsCount: number;
  totalComplaintWeight: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const ComplaintsCharts: React.FC<ComplaintsChartsProps> = ({
  complaintDefectData,
  complaintSeverityData,
  totalComplaintsCount,
  totalComplaintWeight,
  hasActiveFilters,
  onResetFilters
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Bar Chart: Frequência de Reclamações por Defeito */}
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Reclamações por Defeito {hasActiveFilters && '(Filtrado)'}
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                Incidência de chamados de SAC por motivo técnico
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
              Total: {totalComplaintsCount} queixas ({totalComplaintWeight.toLocaleString('pt-BR')} kg)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {complaintDefectData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-6 text-center">
              <AlertCircle className="w-7 h-7 text-slate-600 mb-1" />
              <span className="font-semibold text-slate-300">Nenhuma reclamação registrada para os filtros selecionados.</span>
              <span className="text-[11px] text-slate-500">Ajuste o período ou selecione outro cliente para visualizar.</span>
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
              <BarChart data={complaintDefectData} margin={{ top: 12, right: 10, left: -5, bottom: 25 }}>
                <defs>
                  {complaintDefectData.map((entry, index) => (
                    <linearGradient key={`complaint-bar-grad-${index}`} id={`complaint-bar-grad-${index}`} x1="0" y1="0" x2="0" y2="1">
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
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as ComplaintDefectItem;
                      const pct = totalComplaintsCount > 0 ? ((item.count / totalComplaintsCount) * 100).toFixed(1) : '0';
                      return (
                        <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[200px]">
                          <div className="flex items-center gap-2 font-bold text-white text-sm pb-1 border-b border-slate-800/80">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 font-mono">
                            <span className="text-slate-400">Ocorrências:</span>
                            <span className="font-bold text-white">
                              {item.count} chamado{item.count > 1 ? 's' : ''}
                              <span className="text-slate-400 font-normal ml-1">({pct}%)</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">Peso Reclamado:</span>
                            <span className="font-bold text-rose-400">
                              {item.totalWeight.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[7, 7, 0, 0]}>
                  {complaintDefectData.map((entry, index) => (
                    <Cell
                      key={`complaint-cell-${index}`}
                      fill={`url(#complaint-bar-grad-${index})`}
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

      {/* 2. Donut Chart: Distribuição por Severidade */}
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Gravidade das Reclamações
              </h3>
              <p className="text-[11px] text-slate-400">
                Classificação de severidade técnica
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
            SAC Geral
          </span>
        </div>

        <div className="h-52 w-full flex items-center justify-center relative">
          {complaintSeverityData.length === 0 ? (
            <div className="text-slate-500 text-xs">Sem queixas no filtro ativo</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintSeverityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#020617"
                    strokeWidth={2}
                  >
                    {complaintSeverityData.map((entry, index) => (
                      <Cell
                        key={`severity-cell-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as SeverityItem;
                        const pct = totalComplaintsCount > 0 ? ((item.value / totalComplaintsCount) * 100).toFixed(1) : '0';
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1 backdrop-blur-md min-w-[160px]">
                            <div className="flex items-center gap-2 font-bold text-white">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>Gravidade {item.name}</span>
                            </div>
                            <div className="font-mono font-bold text-sm text-white">
                              {item.value} chamado{item.value > 1 ? 's' : ''}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {pct}% do total de reclamações
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
                  Total Queixas
                </span>
                <span className="text-base font-bold font-mono text-white">
                  {totalComplaintsCount}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {totalComplaintWeight.toLocaleString('pt-BR')} kg
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/60">
          {complaintSeverityData.map((item, idx) => {
            const pct = totalComplaintsCount > 0 ? ((item.value / totalComplaintsCount) * 100).toFixed(1) : '0';
            return (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] hover:bg-slate-900/60 px-1.5 py-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-300 font-medium">
                    Gravidade {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-[10px] text-slate-400 font-semibold">{pct}%</span>
                  <span className="font-bold text-white">
                    {item.value} ocorrência{item.value > 1 ? 's' : ''}
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
