'use client';

import React, { useState, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import { PackageCheck, AlertTriangle } from 'lucide-react';
import { DefectCategory } from '@/types';
import { HARMONIOUS_CHART_COLORS } from '@/lib/chartColors';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { NewComplaintModal } from '@/components/reclamacoes/NewComplaintModal';

// Modular Dashboard Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardFiltersBar } from '@/components/dashboard/DashboardFiltersBar';
import { DashboardKpis } from '@/components/dashboard/DashboardKpis';
import { ConcessionsCharts } from '@/components/dashboard/ConcessionsCharts';
import { ComplaintsCharts } from '@/components/dashboard/ComplaintsCharts';
import { TopCustomersTable } from '@/components/dashboard/TopCustomersTable';
import { RecentActivitiesTable } from '@/components/dashboard/RecentActivitiesTable';

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
  const [activeChartTab, setActiveChartTab] = useState<'concessoes' | 'reclamacoes'>('concessoes');

  // Modals
  const [isNewConcessionOpen, setIsNewConcessionOpen] = useState(false);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);

  // Available defects based on category
  const availableDefects = useMemo(() => {
    if (selectedCategory === 'todas') return defects;
    return defects.filter(d => d.category === selectedCategory);
  }, [defects, selectedCategory]);

  const handleCategoryChange = (cat: DefectCategory | 'todas') => {
    setSelectedCategory(cat);
    if (cat !== 'todas' && selectedDefectId !== 'todos') {
      const def = defects.find(d => d.id === selectedDefectId);
      if (def && def.category !== cat) {
        setSelectedDefectId('todos');
      }
    }
  };

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

      if (selectedCustomerId !== 'todos' && item.customerId !== selectedCustomerId) return false;

      if (selectedCategory !== 'todas') {
        const def = defects.find(d => d.id === item.defectTypeId);
        if (def && def.category !== selectedCategory) return false;
      }

      if (selectedDefectId !== 'todos' && item.defectTypeId !== selectedDefectId) return false;

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

      // Temporal
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

  // 2. Métricas dos KPIs
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

  // 3. Agrupamento por Defeito (Concessões)
  const defectData = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; amount: number; color: string }> = {};

    filteredConcessions.forEach(c => {
      const def = defects.find(d => d.id === c.defectTypeId);
      const name = c.defectTypeName || def?.name || 'Desvio Não Especificado';

      if (!map[c.defectTypeId]) {
        map[c.defectTypeId] = { name, quantity: 0, amount: 0, color: '' };
      }
      map[c.defectTypeId].quantity += c.quantity || 0;
      map[c.defectTypeId].amount += c.totalSavedValue || 0;
    });

    const sorted = Object.values(map)
      .filter(d => d.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);

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

  // 4. Ranking de Clientes (Concessões)
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

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredConcessions]);

  // 5. Reclamações Filtradas
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = item.code?.toLowerCase().includes(term);
        const matchesCust = item.customerName?.toLowerCase().includes(term);
        const matchesOp = item.opNumber?.toLowerCase().includes(term);
        const matchesDef = item.defectTypeName?.toLowerCase().includes(term);
        const matchesLot = item.lotNumber?.toLowerCase().includes(term);
        const matchesBale = item.bales?.some(b => b.toLowerCase().includes(term));
        const matchesDesc = item.description?.toLowerCase().includes(term);

        if (!matchesCode && !matchesCust && !matchesOp && !matchesDef && !matchesLot && !matchesBale && !matchesDesc) {
          return false;
        }
      }

      if (selectedCustomerId !== 'todos' && item.customerId !== selectedCustomerId) return false;
      if (selectedDefectId !== 'todos' && item.defectTypeId !== selectedDefectId) return false;

      if (selectedCategory !== 'todas') {
        const def = defects.find(d => d.id === item.defectTypeId);
        if (def && def.category !== selectedCategory) return false;
      }

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
  }, [complaints, defects, searchTerm, selectedCustomerId, selectedCategory, selectedDefectId, period, startDate, endDate]);

  // 6. Agrupamento de Reclamações
  const complaintDefectData = useMemo(() => {
    const map: Record<string, { name: string; count: number; totalWeight: number; color: string }> = {};

    filteredComplaints.forEach(c => {
      const def = defects.find(d => d.id === c.defectTypeId);
      const name = c.defectTypeName || def?.name || 'Desvio Não Especificado';

      if (!map[c.defectTypeId]) {
        map[c.defectTypeId] = { name, count: 0, totalWeight: 0, color: '' };
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

  // 7. Severidade (SAC)
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

  // 8. Ranking de Clientes (Reclamações)
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

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredComplaints]);

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
      {/* 1. Header do Painel */}
      <DashboardHeader
        isSyncing={isSyncing}
        onRefresh={() => refreshData()}
        onNewConcession={() => setIsNewConcessionOpen(true)}
        onNewComplaint={() => setIsNewComplaintOpen(true)}
        onOpenAi={() => openAiDrawer()}
      />

      {/* 2. Barra de Filtros Inteligentes */}
      <DashboardFiltersBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        period={period}
        onPeriodChange={setPeriod}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        selectedCustomerId={selectedCustomerId}
        onCustomerChange={setSelectedCustomerId}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedDefectId={selectedDefectId}
        onDefectChange={setSelectedDefectId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        customers={customers}
        availableDefects={availableDefects}
        filteredCount={filteredConcessions.length}
        totalCount={concessions.length}
        totalSaved={totalSaved}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        onResetFilters={resetFilters}
        categoryLabels={CATEGORY_LABELS}
        selectedCustomerName={selectedCustomerName}
        selectedDefectName={selectedDefectName}
      />

      {/* 3. Cards Mestres de KPIs */}
      <DashboardKpis
        totalUnits={totalUnits}
        totalWeightKg={totalWeightKg}
        totalSaved={totalSaved}
        avgSavedPerUnit={avgSavedPerUnit}
        acceptanceRate={acceptanceRate}
        hasActiveFilters={hasActiveFilters}
        sackWeightGrams={settings?.sackWeightGrams}
      />

      {/* 4. Barra de Abas de Gráficos */}
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
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeChartTab === 'concessoes' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
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
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeChartTab === 'reclamacoes' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
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

      {/* 5. Área de Gráficos e Tabelas */}
      {activeChartTab === 'concessoes' ? (
        <>
          <ConcessionsCharts
            defectData={defectData}
            pieData={pieData}
            totalUnits={totalUnits}
            totalSaved={totalSaved}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TopCustomersTable
              type="concessoes"
              concessionCustomers={topCustomersRanking}
              totalSaved={totalSaved}
              hasActiveFilters={hasActiveFilters}
            />

            <RecentActivitiesTable
              type="concessoes"
              concessions={filteredConcessions}
              allComplaints={complaints}
              totalCount={concessions.length}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          </div>
        </>
      ) : (
        <>
          <ComplaintsCharts
            complaintDefectData={complaintDefectData}
            complaintSeverityData={complaintSeverityData}
            totalComplaintsCount={filteredComplaints.length}
            totalComplaintWeight={totalComplaintWeight}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TopCustomersTable
              type="reclamacoes"
              complaintCustomers={topComplaintCustomersRanking}
              totalComplaintsCount={filteredComplaints.length}
              hasActiveFilters={hasActiveFilters}
            />

            <RecentActivitiesTable
              type="reclamacoes"
              complaints={filteredComplaints}
              totalCount={complaints.length}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          </div>
        </>
      )}

      {/* 6. Modais de Ação */}
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
