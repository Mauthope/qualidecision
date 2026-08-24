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
  CartesianGrid
} from 'recharts';
import { BarChart3, TrendingUp, Layers, DollarSign, Package } from 'lucide-react';

export const DefectDistributionChart: React.FC = () => {
  const { stats, concessions } = useQuality();
  const [viewMode, setViewMode] = useState<'quantity' | 'amount'>('quantity');

  // Prepare chart data from defectsVolumeMonth
  const data = Object.values(stats.defectsVolumeMonth)
    .filter(d => d.quantity > 0)
    .map(d => ({
      name: d.name.length > 18 ? d.name.slice(0, 16) + '...' : d.name,
      fullName: d.name,
      quantity: d.quantity,
      amount: d.amount,
      color: d.color
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const totalVolume = data.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSaved = data.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              Monitor de Desvios & Lucratividade por Defeito
            </h3>
            <p className="text-xs text-slate-400">
              Volume expedido por tipo de concessão no período corrente
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('quantity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'quantity'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Volume (unidades)</span>
          </button>
          <button
            onClick={() => setViewMode('amount')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'amount'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Lucro Salvo (R$)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Nenhum envio com concessão registrado até o momento.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={val =>
                  viewMode === 'quantity'
                    ? `${(val / 1000).toFixed(0)}k`
                    : `R$ ${(val / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-1 backdrop-blur-md">
                        <div className="font-bold text-white text-sm">{item.fullName}</div>
                        <div className="text-cyan-400 font-mono">
                          Volume: <strong>{item.quantity.toLocaleString('pt-BR')} unidades</strong>
                        </div>
                        <div className="text-emerald-400 font-mono">
                          Scrap Evitado: <strong>R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                          Representa {((item.quantity / totalVolume) * 100).toFixed(1)}% do volume total concedido
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={viewMode === 'quantity' ? 'quantity' : 'amount'}
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || '#06b6d4'}
                    className="hover:opacity-85 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
        {data.map((item, idx) => {
          const percent = totalVolume > 0 ? (item.quantity / totalVolume) * 100 : 0;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.fullName}
                </span>
                <span className="font-mono text-cyan-400 font-bold shrink-0">
                  {item.quantity.toLocaleString('pt-BR')} un
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: item.color }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{percent.toFixed(1)}% do mix</span>
                <span className="text-emerald-400 font-semibold">
                  R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
