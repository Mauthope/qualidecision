'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  Calendar,
  Building2,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  AlertCircle,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Customer, DefectType, DefectCategory } from '@/types';

interface DashboardFiltersBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  period: string;
  onPeriodChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  selectedCustomerId: string;
  onCustomerChange: (val: string) => void;
  selectedCategory: DefectCategory | 'todas';
  onCategoryChange: (val: DefectCategory | 'todas') => void;
  selectedDefectId: string;
  onDefectChange: (val: string) => void;
  selectedStatus: 'todos' | 'aceito' | 'em_transito' | 'reclamado';
  onStatusChange: (val: 'todos' | 'aceito' | 'em_transito' | 'reclamado') => void;
  customers: Customer[];
  availableDefects: DefectType[];
  filteredCount: number;
  totalCount: number;
  totalSaved: number;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onResetFilters: () => void;
  categoryLabels: Record<DefectCategory, string>;
  selectedCustomerName: string | null;
  selectedDefectName: string | null;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersBarProps> = ({
  searchTerm,
  onSearchChange,
  period,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedCustomerId,
  onCustomerChange,
  selectedCategory,
  onCategoryChange,
  selectedDefectId,
  onDefectChange,
  selectedStatus,
  onStatusChange,
  customers,
  availableDefects,
  filteredCount,
  totalCount,
  totalSaved,
  hasActiveFilters,
  activeFilterCount,
  onResetFilters,
  categoryLabels,
  selectedCustomerName,
  selectedDefectName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glow-card p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl space-y-3.5">
      {/* Primary Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fardo, OP, cliente ou defeito..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Period Dropdown */}
        <div className="lg:col-span-3">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={period}
              onChange={e => onPeriodChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="todos">Todo o Histórico</option>
              <option value="ano_2026">Ano de 2026</option>
              <option value="ano_2025">Ano de 2025</option>
              <option value="ultimos_30">Últimos 30 Dias</option>
              <option value="ultimos_90">Últimos 90 Dias</option>
              <option value="mes_atual">Mês Atual</option>
              <option value="mes_anterior">Mês Anterior</option>
              <option value="custom">Personalizado...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Customer Dropdown */}
        <div className="lg:col-span-3">
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCustomerId}
              onChange={e => onCustomerChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer truncate"
            >
              <option value="todos">Todos os Clientes ({customers.length})</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Toggle Advanced Filters & Reset */}
        <div className="lg:col-span-2 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isExpanded || selectedCategory !== 'todas' || selectedDefectId !== 'todos' || selectedStatus !== 'todos'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Limpar todos os filtros"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Date Range Row */}
      {period === 'custom' && (
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <span className="text-xs font-semibold text-slate-400">Intervalo de Datas:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => onStartDateChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => onEndDateChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Categoria do Desvio
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={e => onCategoryChange(e.target.value as DefectCategory | 'todas')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
              >
                <option value="todas">Todas as Categorias</option>
                {(Object.keys(categoryLabels) as DefectCategory[]).map(catKey => (
                  <option key={catKey} value={catKey}>
                    {categoryLabels[catKey]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Defeito Específico
            </label>
            <div className="relative">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDefectId}
                onChange={e => onDefectChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer truncate"
              >
                <option value="todos">Todos os Defeitos ({availableDefects.length})</option>
                {availableDefects.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Status da Concessão
            </label>
            <div className="relative">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={e => onStatusChange(e.target.value as 'todos' | 'aceito' | 'em_transito' | 'reclamado')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="aceito">Aceito sem Ressalvas</option>
                <option value="em_transito">Em Trânsito</option>
                <option value="reclamado">Reclamado no SAC</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Summary and Active Filter Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/50 text-xs">
        <div className="flex items-center gap-2 flex-wrap text-slate-400">
          <span>
            Exibindo <strong className="text-cyan-300 font-mono">{filteredCount}</strong> de <span className="font-mono">{totalCount}</span> envios concedidos
          </span>
          {totalSaved > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold font-mono">
                R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recuperados
              </span>
            </>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]">
                Busca: &quot;{searchTerm}&quot;
                <button type="button" onClick={() => onSearchChange('')}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            )}
            {period !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]">
                Período: {period.replace('_', ' ')}
                <button type="button" onClick={() => onPeriodChange('todos')}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            )}
            {selectedCustomerName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px]">
                Cliente: {selectedCustomerName.slice(0, 18)}...
                <button type="button" onClick={() => onCustomerChange('todos')}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            )}
            {selectedCategory !== 'todas' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                Categoria: {selectedCategory}
                <button type="button" onClick={() => onCategoryChange('todas')}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            )}
            {selectedDefectName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                Defeito: {selectedDefectName}
                <button type="button" onClick={() => onDefectChange('todos')}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            )}
            {selectedStatus !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                Status: {selectedStatus}
                <button type="button" onClick={() => onStatusChange('todos')}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] text-slate-400 hover:text-rose-300 underline transition-colors cursor-pointer ml-1"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
