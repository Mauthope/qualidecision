'use client';

import React, { useState, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
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
  Send,
  AlertCircle,
  Plus,
  Bot,
  Layers,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  X,
  RotateCcw,
  Calendar,
  Building2,
  Tag,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Scale
} from 'lucide-react';
import { DefectCategory } from '@/types';
import { HARMONIOUS_CHART_COLORS } from '@/lib/chartColors';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { NewComplaintModal } from '@/components/reclamacoes/NewComplaintModal';

const CATEGORY_LABELS: Record<DefectCategory, string> = {
  costura: 'Costura & Fechamento',
  solda: 'Solda & Válvula',
  impressao: 'Impressão & Arte',
  dimensional: 'Dimensional & Corte',
  estrutural: 'Estrutural & Tecido',
  visual: 'Visual & Limpeza',
  outro: 'Outros Desvios'
};

export default function DashboardPage() {
  const {
    concessions,
    complaints,
    customers,
    defects,
    settings,
    openAiDrawer,
    isLoaded,
    isSyncing,
    refreshData
  } = useQuality();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<string>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('todos');
  const [selectedCategory, setSelectedCategory] = useState<DefectCategory | 'todas'>('todas');
  const [selectedDefectId, setSelectedDefectId] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'aceito' | 'em_transito' | 'reclamado'>('todos');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'concessoes' | 'reclamacoes'>('concessoes');

  // Modals
  const [isNewConcessionOpen, setIsNewConcessionOpen] = useState(false);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);

  // List of defects available based on chosen category
  const availableDefects = useMemo(() => {
    if (selectedCategory === 'todas') return defects;
    return defects.filter(d => d.category === selectedCategory);
  }, [defects, selectedCategory]);

  // When category changes, reset specific defect if not in category
  const handleCategoryChange = (cat: DefectCategory | 'todas') => {
    setSelectedCategory(cat);
    if (cat !== 'todas' && selectedDefectId !== 'todos') {
      const def = defects.find(d => d.id === selectedDefectId);
      if (def && def.category !== cat) {
        setSelectedDefectId('todos');
      }
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setPeriod('todos');
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('todos');
    setSelectedCategory('todas');
    setSelectedDefectId('todos');
    setSelectedStatus('todos');
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    period !== 'todos' ||
    selectedCustomerId !== 'todos' ||
    selectedCategory !== 'todas' ||
    selectedDefectId !== 'todos' ||
    selectedStatus !== 'todos' ||
    startDate ||
    endDate
  );

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (period !== 'todos') count++;
    if (selectedCustomerId !== 'todos') count++;
    if (selectedCategory !== 'todas') count++;
    if (selectedDefectId !== 'todos') count++;
    if (selectedStatus !== 'todos') count++;
    if (startDate || endDate) count++;
    return count;
  }, [searchTerm, period, selectedCustomerId, selectedCategory, selectedDefectId, selectedStatus, startDate, endDate]);

  // 1. Filtragem Central das Concessões
  const filteredConcessions = useMemo(() => {
    return concessions.filter(item => {
      // Filtro de Busca Textual (Fardo, OP, Lote, Cliente, Produto, Defeito, Código)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesClient = item.customerName?.toLowerCase().includes(term);
        const matchesDefect = item.defectTypeName?.toLowerCase().includes(term);
        const matchesProduct = item.productName?.toLowerCase().includes(term);
        const matchesOp = item.opNumber?.toLowerCase().includes(term);
        const matchesLot = item.lotNumber?.toLowerCase().includes(term);
        const matchesCode = item.code?.toLowerCase().includes(term);
        const matchesBales = item.bales?.some(b => b.toLowerCase().includes(term));

        if (!matchesClient && !matchesDefect && !matchesProduct && !matchesOp && !matchesLot && !matchesCode && !matchesBales) {
          return false;
        }
      }

      // Filtro por Cliente
      if (selectedCustomerId !== 'todos') {
        if (item.customerId !== selectedCustomerId) return false;
      }

      // Filtro por Categoria do Defeito
      if (selectedCategory !== 'todas') {
        const def = defects.find(d => d.id === item.defectTypeId);
        if (def && def.category !== selectedCategory) return false;
      }

      // Filtro por Defeito Específico
      if (selectedDefectId !== 'todos') {
        if (item.defectTypeId !== selectedDefectId) return false;
      }

      // Status da Concessão
      const isReclaimed = complaints.some(
        comp =>
          comp.customerId === item.customerId &&
          (((comp.lotNumber && item.lotNumber && comp.lotNumber.toLowerCase().includes(item.lotNumber.toLowerCase())) ||
            (comp.bales && item.bales && comp.bales.some(b => item.bales?.includes(b)))) ||
            (comp.defectTypeId === item.defectTypeId && new Date(comp.date) >= new Date(item.date)))
      ) || item.customerFeedbackStatus === 'reclamado_posteriormente';

      if (selectedStatus === 'reclamado' && !isReclaimed) return false;
      if (selectedStatus === 'aceito' && (isReclaimed || item.customerFeedbackStatus !== 'aceito_sem_ressalvas')) return false;
      if (selectedStatus === 'em_transito' && (isReclaimed || item.customerFeedbackStatus === 'aceito_sem_ressalvas')) return false;

      // Filtro Temporal
      if (period === 'custom') {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;
      } else if (period === 'ano_2026') {
        if (!item.date?.startsWith('2026')) return false;
      } else if (period === 'ano_2025') {
        if (!item.date?.startsWith('2025')) return false;
      } else if (period === 'mes_atual') {
        const now = new Date();
        const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!item.date?.startsWith(currentYM)) return false;
      } else if (period === 'mes_anterior') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const prevYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!item.date?.startsWith(prevYM)) return false;
      } else if (period === 'ultimos_30') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const limitStr = d.toISOString().split('T')[0];
        if (item.date < limitStr) return false;
      } else if (period === 'ultimos_90') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        const limitStr = d.toISOString().split('T')[0];
        if (item.date < limitStr) return false;
      }

      return true;
    });
  }, [concessions, complaints, defects, searchTerm, selectedCustomerId, selectedCategory, selectedDefectId, selectedStatus, period, startDate, endDate]);

  // 2. KPIs Dinâmicos Baseados no Filtro Atual
  const totalUnits = useMemo(() => {
    return filteredConcessions.reduce((acc, c) => acc + (c.quantity || 0), 0);
  }, [filteredConcessions]);

  const totalSaved = useMemo(() => {
    return filteredConcessions.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);
  }, [filteredConcessions]);

  const avgSavedPerUnit = totalUnits > 0 ? totalSaved / totalUnits : 0;

  const totalWeightKg = useMemo(() => {
    const gramWeight = settings?.sackWeightGrams || 77.73;
    return (totalUnits * gramWeight) / 1000;
  }, [totalUnits, settings?.sackWeightGrams]);

  const acceptanceRate = useMemo(() => {
    if (filteredConcessions.length === 0) return 100;
    const reclaimedCount = filteredConcessions.filter(item => {
      return complaints.some(
        comp =>
          comp.customerId === item.customerId &&
          (((comp.lotNumber && item.lotNumber && comp.lotNumber.toLowerCase().includes(item.lotNumber.toLowerCase())) ||
            (comp.bales && item.bales && comp.bales.some(b => item.bales?.includes(b)))) ||
            (comp.defectTypeId === item.defectTypeId && new Date(comp.date) >= new Date(item.date)))
      ) || item.customerFeedbackStatus === 'reclamado_posteriormente';
    }).length;

    const rate = ((filteredConcessions.length - reclaimedCount) / filteredConcessions.length) * 100;
    return Math.max(0, Math.min(100, rate));
  }, [filteredConcessions, complaints]);

  // 3. Agrupamento por Defeito (Barras e Pizza) com Cores Harmoniosas
  const defectData = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; amount: number; color: string }> = {};

    filteredConcessions.forEach(c => {
      const def = defects.find(d => d.id === c.defectTypeId);
      const name = c.defectTypeName || def?.name || 'Desvio Não Especificado';

      if (!map[c.defectTypeId]) {
        map[c.defectTypeId] = {
          name,
          quantity: 0,
          amount: 0,
          color: ''
        };
      }
      map[c.defectTypeId].quantity += c.quantity || 0;
      map[c.defectTypeId].amount += c.totalSavedValue || 0;
    });

    const sorted = Object.values(map)
      .filter(d => d.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);

    // Atribui uma cor única e harmoniosa para cada defeito do ranking
    return sorted.map((item, index) => ({
      ...item,
      color: HARMONIOUS_CHART_COLORS[index % HARMONIOUS_CHART_COLORS.length]
    }));
  }, [filteredConcessions, defects]);

  const pieData = useMemo(() => {
    return defectData.map(d => ({
      name: d.name,
      value: d.amount,
      color: d.color
    }));
  }, [defectData]);

  // 4. Ranking de Clientes (Baseado nos Lotes Filtrados)
  const topCustomersRanking = useMemo(() => {
    const map: Record<string, { customerId: string; customerName: string; totalUnits: number; totalAmount: number; count: number }> = {};

    filteredConcessions.forEach(c => {
      if (!map[c.customerId]) {
        map[c.customerId] = {
          customerId: c.customerId,
          customerName: c.customerName,
          totalUnits: 0,
          totalAmount: 0,
          count: 0
        };
      }
      map[c.customerId].totalUnits += c.quantity || 0;
      map[c.customerId].totalAmount += c.totalSavedValue || 0;
      map[c.customerId].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredConcessions]);

  // 5. Reclamações Filtradas Dinamicamente
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      // Busca por texto livre
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = item.code?.toLowerCase().includes(term);
        const matchesCust = item.customerName?.toLowerCase().includes(term);
        const matchesDef = item.defectTypeName?.toLowerCase().includes(term);
        const matchesLot = item.lotNumber?.toLowerCase().includes(term);
        const matchesBale = item.bales?.some(b => b.toLowerCase().includes(term));
        const matchesDesc = item.description?.toLowerCase().includes(term);

        if (!matchesCode && !matchesCust && !matchesDef && !matchesLot && !matchesBale && !matchesDesc) {
          return false;
        }
      }

      // Filtro por Cliente
      if (selectedCustomerId !== 'todos' && item.customerId !== selectedCustomerId) {
        return false;
      }

      // Filtro por Defeito Específico
      if (selectedDefectId !== 'todos' && item.defectTypeId !== selectedDefectId) {
        return false;
      }

      // Filtro por Categoria Técnica
      if (selectedCategory !== 'todas') {
        const def = defects.find(d => d.id === item.defectTypeId);
        if (def && def.category !== selectedCategory) return false;
      }

      // Filtro por Período
      if (period === 'personalizado') {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;
      } else if (period === 'ano_2026') {
        if (!item.date?.startsWith('2026')) return false;
      } else if (period === 'ano_2025') {
        if (!item.date?.startsWith('2025')) return false;
      } else if (period === 'mes_atual') {
        const now = new Date();
        const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!item.date?.startsWith(currentYM)) return false;
      } else if (period === 'mes_anterior') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const prevYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!item.date?.startsWith(prevYM)) return false;
      } else if (period === 'ultimos_30') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const limitStr = d.toISOString().split('T')[0];
        if (item.date < limitStr) return false;
      } else if (period === 'ultimos_90') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        const limitStr = d.toISOString().split('T')[0];
        if (item.date < limitStr) return false;
      }

      return true;
    });
  }, [complaints, defects, searchTerm, selectedCustomerId, selectedCategory, selectedDefectId, period, startDate, endDate]);

  // 6. Agrupamento de Reclamações por Defeito (Barras do SAC)
  const complaintDefectData = useMemo(() => {
    const map: Record<string, { name: string; count: number; totalWeight: number; color: string }> = {};

    filteredComplaints.forEach(c => {
      const def = defects.find(d => d.id === c.defectTypeId);
      const name = c.defectTypeName || def?.name || 'Desvio Não Especificado';

      if (!map[c.defectTypeId]) {
        map[c.defectTypeId] = {
          name,
          count: 0,
          totalWeight: 0,
          color: ''
        };
      }
      map[c.defectTypeId].count += 1;
      map[c.defectTypeId].totalWeight += c.quantityAffected || 0;
    });

    const sorted = Object.values(map)
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);

    return sorted.map((item, index) => ({
      ...item,
      color: HARMONIOUS_CHART_COLORS[index % HARMONIOUS_CHART_COLORS.length]
    }));
  }, [filteredComplaints, defects]);

  const totalComplaintWeight = useMemo(() => {
    return filteredComplaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
  }, [filteredComplaints]);

  // 7. Distribuição por Severidade (Donut do SAC)
  const complaintSeverityData = useMemo(() => {
    let leve = 0;
    let moderada = 0;
    let severa = 0;

    filteredComplaints.forEach(c => {
      if (c.severity === 'severa') severa++;
      else if (c.severity === 'moderada') moderada++;
      else leve++;
    });

    return [
      { name: 'Severa', value: severa, color: '#f43f5e' },
      { name: 'Moderada', value: moderada, color: '#f59e0b' },
      { name: 'Leve', value: leve, color: '#10b981' }
    ].filter(i => i.value > 0);
  }, [filteredComplaints]);

  // 8. Ranking de Clientes com Mais Reclamações
  const topComplaintCustomersRanking = useMemo(() => {
    const map: Record<string, { customerId: string; customerName: string; count: number; totalWeight: number }> = {};

    filteredComplaints.forEach(c => {
      if (!map[c.customerId]) {
        map[c.customerId] = {
          customerId: c.customerId,
          customerName: c.customerName,
          count: 0,
          totalWeight: 0
        };
      }
      map[c.customerId].count += 1;
      map[c.customerId].totalWeight += c.quantityAffected || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count);
  }, [filteredComplaints]);

  // Selected entities names for active filter pills
  const selectedCustomerName = useMemo(() => {
    if (selectedCustomerId === 'todos') return null;
    return customers.find(c => c.id === selectedCustomerId)?.name || selectedCustomerId;
  }, [customers, selectedCustomerId]);

  const selectedDefectName = useMemo(() => {
    if (selectedDefectId === 'todos') return null;
    return defects.find(d => d.id === selectedDefectId)?.name || selectedDefectId;
  }, [defects, selectedDefectId]);

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Painel Executivo de Qualidade & Lucratividade</span>
            </div>

            {/* Sync status indicator */}
            <button
              onClick={() => refreshData()}
              title="Clique para forçar sincronização com a nuvem"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando nuvem...' : 'Nuvem conectada'}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Dashboard de Concessões & Scrap Evitado
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe o volume expedido por tipo de desvio, rentabilidade recuperada e histórico em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsNewConcessionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Envio</span>
          </button>

          <button
            onClick={() => setIsNewComplaintOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Reclamação</span>
          </button>

          <button
            onClick={() => openAiDrawer()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">IA de Qualidade</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛠️ BARRA DE FILTROS AVANÇADOS DO DASHBOARD                              */}
      {/* ========================================================================= */}
      <div className="glow-card p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl space-y-3.5">
        
        {/* Linha Principal de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Busca Rápida (Fardo, OP, Cliente, Lote, Defeito) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por fardo, OP, cliente, defeito..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Período Temporal */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
              >
                <option value="todos">📅 Período: Todo o Histórico</option>
                <option value="ano_2026">Ano de 2026</option>
                <option value="ano_2025">Ano de 2025</option>
                <option value="ultimos_30">Últimos 30 Dias</option>
                <option value="ultimos_90">Últimos 90 Dias</option>
                <option value="mes_atual">Mês Atual</option>
                <option value="mes_anterior">Mês Anterior</option>
                <option value="custom">Período Personalizado...</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Filtro por Cliente */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer truncate"
              >
                <option value="todos">🏢 Cliente: Todos ({customers.length})</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Botões de Ação dos Filtros: Expandir Avançados + Limpar */}
          <div className="lg:col-span-2 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterExpanded || selectedCategory !== 'todas' || selectedDefectId !== 'todos' || selectedStatus !== 'todos'
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
                onClick={resetFilters}
                title="Limpar todos os filtros"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Linha Opcional de Datas Personalizadas (se period === 'custom') */}
        {period === 'custom' && (
          <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-slate-400">Intervalo de Datas:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        )}

        {/* Linha Avançada Expansível (Categoria, Defeito Específico, Status) */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            
            {/* Categoria Técnica */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Categoria do Desvio
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={e => handleCategoryChange(e.target.value as DefectCategory | 'todas')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                  <option value="todas">Todas as Categorias</option>
                  {(Object.keys(CATEGORY_LABELS) as DefectCategory[]).map(catKey => (
                    <option key={catKey} value={catKey}>
                      {CATEGORY_LABELS[catKey]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Defeito Específico (filtrado por categoria se selecionada) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Defeito Específico
              </label>
              <div className="relative">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedDefectId}
                  onChange={e => setSelectedDefectId(e.target.value)}
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

            {/* Status da Concessão */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Status da Concessão
              </label>
              <div className="relative">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="aceito">Aceito sem Ressalvas</option>
                  <option value="em_transito">Em Trânsito / Aguardando</option>
                  <option value="reclamado">Reclamado pelo Cliente (SAC)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>
        )}

        {/* Barra de Resumo e Chips dos Filtros Ativos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/50 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-slate-400">
            <span>
              Exibindo <strong className="text-cyan-300 font-mono">{filteredConcessions.length}</strong> de <span className="font-mono">{concessions.length}</span> envios concedidos
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

          {/* Chips clicáveis de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]">
                  Busca: &quot;{searchTerm}&quot;
                  <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {period !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]">
                  Período: {period.replace('_', ' ')}
                  <button onClick={() => setPeriod('todos')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {selectedCustomerName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px]">
                  Cliente: {selectedCustomerName.slice(0, 20)}...
                  <button onClick={() => setSelectedCustomerId('todos')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {selectedCategory !== 'todas' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  Cat: {selectedCategory}
                  <button onClick={() => setSelectedCategory('todas')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {selectedDefectName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                  Defeito: {selectedDefectName}
                  <button onClick={() => setSelectedDefectId('todos')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {selectedStatus !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus('todos')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] text-slate-400 hover:text-rose-300 underline transition-colors cursor-pointer ml-1"
              >
                Limpar todos
              </button>
            </div>
          )}
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
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold font-mono text-cyan-300">
              {totalUnits.toLocaleString('pt-BR')} <span className="text-xs font-sans font-normal text-slate-400">un</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-mono text-xs font-bold shadow-inner">
              <Scale className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>
                {totalWeightKg >= 10000
                  ? `${Math.round(totalWeightKg).toLocaleString('pt-BR')} kg`
                  : `${totalWeightKg.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kg`
                }
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="truncate">
              {hasActiveFilters ? 'No filtro selecionado' : 'Sacarias/Bags salvos de virar refugo'}
            </span>
            {totalWeightKg > 0 && (
              <span className="font-mono text-slate-500 text-[10px] shrink-0 ml-2" title={`Média configurada no Memorial: ${settings?.sackWeightGrams || 77.73}g/unidade`}>
                ~{(totalWeightKg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ton
              </span>
            )}
          </div>
        </div>

        <div className="glow-card p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Lucro Salvo (Scrap Evitado)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            R$ {avgSavedPerUnit.toFixed(2)} <span className="text-xs font-sans font-normal text-slate-400">/unidade</span>
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
            {acceptanceRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400">Sem retorno ou queixa posterior</p>
        </div>
      </div>

      {/* Chart Section Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveChartTab('concessoes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeChartTab === 'concessoes'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Gráficos de Concessões</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeChartTab === 'concessoes' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}>
              {filteredConcessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('reclamacoes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeChartTab === 'reclamacoes'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Gráficos de Reclamações (SAC)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeChartTab === 'reclamacoes' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {filteredComplaints.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden md:flex items-center gap-3 pr-2">
          {activeChartTab === 'concessoes' ? (
            <span>Monitoramento de lotes concedidos e valor salvo de refugo</span>
          ) : (
            <span>Incidência de não-conformidades e laudos de SAC abertos por clientes</span>
          )}
        </div>
      </div>

      {activeChartTab === 'concessoes' ? (
        <>
          {/* Graphs Row: Concessões */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart: Volume por Defeito */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                      Volume Expedido por Tipo de Defeito {hasActiveFilters && '(Filtrado)'}
                    </h3>
                    <p className="text-xs text-slate-400 hidden sm:block">
                      Distribuição quantitativa de peças com desvio por tipo de não-conformidade
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
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-600" />
                    <span>Nenhum desvio registrado para os filtros selecionados.</span>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        Limpar filtros
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
                            const item = payload[0].payload;
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

            {/* Donut Chart: Distribuição Financeira */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">
                      Composição do Scrap Salvo
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

              {/* Donut container with central KPI */}
              <div className="h-52 w-full flex items-center justify-center relative">
                {pieData.length === 0 ? (
                  <div className="text-slate-500 text-xs">Sem dados financeiros no filtro</div>
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
                              const item = payload[0].payload;
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
                                    {pct}% do valor total salvo
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Central Executive KPI */}
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

              {/* Mini Legend */}
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

          {/* Top Customers Ranking & Recent Concessions Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Top Customers Ranking for Concessions */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                      Ranking de Clientes por Concessões Aceitas {hasActiveFilters && '(Filtrado)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Parceiros com maior volume de absorção de materiais com desvio controlado
                    </p>
                  </div>
                </div>

                <Link
                  href="/clientes"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  Ver clientes
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-2.5 pr-4">Posição / Cliente</th>
                      <th className="pb-2.5 px-4 text-right">Volume</th>
                      <th className="pb-2.5 px-4 text-right">Valor Preservado</th>
                      <th className="pb-2.5 pl-4 text-right">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topCustomersRanking.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          Nenhum cliente com concessões no filtro selecionado.
                        </td>
                      </tr>
                    ) : (
                      topCustomersRanking.slice(0, 6).map((item, idx) => {
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Concessions Activity */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                      Últimos Envios com Concessão Registrados
                    </h3>
                    <p className="text-xs text-slate-400">
                      Lotes liberados com desvios e parecer de entrega ({filteredConcessions.length} no filtro)
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

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-2.5 pr-3">Fardo(s) / Data</th>
                      <th className="pb-2.5 px-3">Cliente</th>
                      <th className="pb-2.5 px-3">Desvio</th>
                      <th className="pb-2.5 px-3 text-right">Volume</th>
                      <th className="pb-2.5 pl-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredConcessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 space-y-2">
                          <p>Nenhum envio com concessão corresponde aos filtros aplicados.</p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-colors cursor-pointer"
                            >
                              Limpar todos os filtros
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredConcessions.slice(0, 6).map(item => {
                        const isReclaimed = complaints.some(
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Graphs Row: Reclamações (SAC) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart: Frequência de Reclamações por Defeito */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                      Frequência de Reclamações por Tipo de Defeito {hasActiveFilters && '(Filtrado)'}
                    </h3>
                    <p className="text-xs text-slate-400 hidden sm:block">
                      Incidência quantitativa de chamados abertos no SAC por motivo técnico
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    Total: {filteredComplaints.length} queixas ({totalComplaintWeight.toLocaleString('pt-BR')} kg)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                {complaintDefectData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-600" />
                    <span>Nenhuma reclamação registrada para os filtros selecionados.</span>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        Limpar filtros
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
                            const item = payload[0].payload;
                            const pct = filteredComplaints.length > 0 ? ((item.count / filteredComplaints.length) * 100).toFixed(1) : '0';
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

            {/* Donut Chart: Distribuição por Severidade */}
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
                      Classificação técnica de criticidade
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                  SAC Geral
                </span>
              </div>

              {/* Donut container with central KPI */}
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
                              const item = payload[0].payload;
                              const pct = filteredComplaints.length > 0 ? ((item.value / filteredComplaints.length) * 100).toFixed(1) : '0';
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

                    {/* Central Executive KPI */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        Total Queixas
                      </span>
                      <span className="text-base font-bold font-mono text-white">
                        {filteredComplaints.length}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {totalComplaintWeight.toLocaleString('pt-BR')} kg
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Mini Legend for Severity */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/60">
                {complaintSeverityData.map((item, idx) => {
                  const pct = filteredComplaints.length > 0 ? ((item.value / filteredComplaints.length) * 100).toFixed(1) : '0';
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

          {/* Complaints Ranking & Recent Complaints Table */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Top Claiming Customers */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                      Ranking de Clientes por Reclamações (SAC) {hasActiveFilters && '(Filtrado)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Empresas com maior incidência de não-conformidades apontadas
                    </p>
                  </div>
                </div>

                <Link
                  href="/clientes"
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  Ver clientes
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-2.5 pr-4">Posição / Cliente</th>
                      <th className="pb-2.5 px-4 text-right">Ocorrências</th>
                      <th className="pb-2.5 px-4 text-right">Peso Reclamado</th>
                      <th className="pb-2.5 pl-4 text-right">% do SAC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topComplaintCustomersRanking.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          Nenhuma reclamação encontrada para o filtro ativo.
                        </td>
                      </tr>
                    ) : (
                      topComplaintCustomersRanking.slice(0, 6).map((item, idx) => {
                        const pct = filteredComplaints.length > 0 ? (item.count / filteredComplaints.length) * 100 : 0;
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Complaints Table */}
            <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                      Últimas Reclamações de Clientes
                    </h3>
                    <p className="text-xs text-slate-400">
                      Histórico de laudos e queixas de SAC ({filteredComplaints.length} no filtro)
                    </p>
                  </div>
                </div>

                <Link
                  href="/reclamacoes"
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  Ver todas ({complaints.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-2.5 pr-3">Código / Data</th>
                      <th className="pb-2.5 px-3">Cliente</th>
                      <th className="pb-2.5 px-3">Defeito</th>
                      <th className="pb-2.5 px-3 text-right">Peso (Kg)</th>
                      <th className="pb-2.5 pl-3 text-center">Gravidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          Nenhuma reclamação corresponde aos filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredComplaints.slice(0, 6).map(item => (
                        <tr key={item.id} className="hover:bg-slate-900/50">
                          <td className="py-3 pr-3">
                            <div className="font-mono font-bold text-rose-400">{item.code}</div>
                            <div className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-200 truncate max-w-[130px]">
                            {item.customerName}
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <NewConcessionModal
        isOpen={isNewConcessionOpen}
        onClose={() => setIsNewConcessionOpen(false)}
      />

      <NewComplaintModal
        isOpen={isNewComplaintOpen}
        onClose={() => setIsNewComplaintOpen(false)}
      />
    </div>
  );
}
