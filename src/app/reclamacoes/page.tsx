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
  AlertCircle,
  Search,
  Camera,
  Eye,
  Calendar,
  Wrench,
  CheckCircle2,
  Plus,
  Layers,
  BarChart3,
  Scale,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { NewComplaintModal } from '@/components/reclamacoes/NewComplaintModal';
import { DefectManagementModal } from '@/components/reclamacoes/DefectManagementModal';
import { ComplaintPhoto } from '@/types';
import { HARMONIOUS_CHART_COLORS } from '@/lib/chartColors';

export default function ReclamacoesPage() {
  const { complaints, customers, defects, showToast } = useQuality();
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const [search, setSearch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const s = search.toLowerCase();
      const matchesSearch = c.code.toLowerCase().includes(s) ||
        c.customerName.toLowerCase().includes(s) ||
        (c.lotNumber && c.lotNumber.toLowerCase().includes(s)) ||
        (c.bales && c.bales.some(b => b.toLowerCase().includes(s))) ||
        c.defectTypeName.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s);

      const matchesCustomer = filterCustomer === 'all' || c.customerId === filterCustomer;
      const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;

      return matchesSearch && matchesCustomer && matchesSeverity;
    });
  }, [complaints, search, filterCustomer, filterSeverity]);

  // Cálculos analíticos para os gráficos
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

  const totalWeightAffected = useMemo(() => {
    return filteredComplaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
  }, [filteredComplaints]);

  const severeCount = useMemo(() => {
    return filteredComplaints.filter(c => c.severity === 'severa').length;
  }, [filteredComplaints]);

  const affectedCustomersCount = useMemo(() => {
    return new Set(filteredComplaints.map(c => c.customerId)).size;
  }, [filteredComplaints]);

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Central de Reclamações & Gestão de SAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Reclamações & Não-Conformidades de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Histórico de ocorrências, laudos e cadastro manual de novas queixas com fotos e peso reclamado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${
              showCharts
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>{showCharts ? 'Ocultar Gráficos' : 'Visualizar Gráficos'}</span>
            {showCharts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsDefectModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-cyan-300 transition-all cursor-pointer shadow-sm"
            title="Visualizar e cadastrar defeitos no catálogo da fábrica"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Gestão de Defeitos</span>
          </button>

          <button
            onClick={() => setIsNewComplaintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Acrescentar Reclamação</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por lote, código REC, cliente ou descrição do problema..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterCustomer}
            onChange={e => setFilterCustomer(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Clientes</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todas as Gravidades</option>
            <option value="severa">Severa</option>
            <option value="moderada">Moderada</option>
            <option value="leve">Leve</option>
          </select>
        </div>
      </div>

      {/* Analytics & Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total de Ocorrências</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white">
            {filteredComplaints.length}
          </div>
          <p className="text-[10px] text-slate-500">Chamados no filtro ativo</p>
        </div>

        <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Peso Total Reclamado</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-400">
            {totalWeightAffected.toLocaleString('pt-BR')} kg
          </div>
          <p className="text-[10px] text-slate-500">Material impactado</p>
        </div>

        <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Ocorrências Severas</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400">
            {severeCount}
            <span className="text-xs text-slate-500 ml-1.5 font-normal">
              ({filteredComplaints.length > 0 ? ((severeCount / filteredComplaints.length) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Risco crítico de refugo</p>
        </div>

        <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Clientes Afetados</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400">
            {affectedCustomersCount}
          </div>
          <p className="text-[10px] text-slate-500">Empresas notificantes</p>
        </div>
      </div>

      {/* Visual Charts (Collapsible) */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Ocorrências por Defeito */}
          <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                    Incidência de Reclamações por Tipo de Defeito
                  </h3>
                  <p className="text-xs text-slate-400">
                    Frequência de não-conformidades registradas no SAC
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
                {complaintDefectData.length} motivos
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {complaintDefectData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Nenhuma reclamação correspondente encontrada.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaintDefectData} margin={{ top: 12, right: 10, left: -5, bottom: 25 }}>
                    <defs>
                      {complaintDefectData.map((entry, index) => (
                        <linearGradient key={`reclamacao-grad-${index}`} id={`reclamacao-grad-${index}`} x1="0" y1="0" x2="0" y2="1">
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
                            <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[190px]">
                              <div className="flex items-center gap-2 font-bold text-white text-sm pb-1 border-b border-slate-800/80">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300 font-mono">
                                <span className="text-slate-400">Ocorrências:</span>
                                <span className="font-bold text-white">
                                  {item.count} queixa{item.count > 1 ? 's' : ''} ({pct}%)
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
                          key={`cell-${index}`}
                          fill={`url(#reclamacao-grad-${index})`}
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

          {/* Donut Chart: Gravidade das Queixas */}
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
                    Severidade do impacto
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                SAC
              </span>
            </div>

            {/* Donut container with central KPI */}
            <div className="h-52 w-full flex items-center justify-center relative">
              {complaintSeverityData.length === 0 ? (
                <div className="text-slate-500 text-xs">Sem ocorrências no filtro</div>
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
                            key={`sev-cell-${index}`}
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
                      Total SAC
                    </span>
                    <span className="text-base font-bold font-mono text-white">
                      {filteredComplaints.length}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {totalWeightAffected.toLocaleString('pt-BR')} kg
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
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="glow-card p-10 text-center text-xs text-slate-500 space-y-2 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma reclamação encontrada com os filtros atuais.</p>
          </div>
        ) : (
          filteredComplaints.map(item => (
            <div
              key={item.id}
              className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Header: Code, Customer, Lot, Date, Severity */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    {item.code}
                  </span>
                  <Link
                    href={`/clientes/${item.customerId}`}
                    className="font-bold text-white hover:text-cyan-300 text-sm sm:text-base transition-colors"
                  >
                    {item.customerName}
                  </Link>
                  {item.bales && item.bales.length > 0 ? (
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/25" title={`Fardos reclamados: ${item.bales.join(', ')}`}>
                      📦 {item.bales.length} fardo{item.bales.length > 1 ? 's' : ''}: {item.bales.slice(0, 4).join(', ')}{item.bales.length > 4 ? ` (+${item.bales.length - 4})` : ''}
                    </span>
                  ) : item.lotNumber ? (
                    <span className="text-xs text-slate-400 font-mono">
                      {item.lotNumber.startsWith('Fardo') ? item.lotNumber : `Fardo/Lote: ${item.lotNumber}`}
                    </span>
                  ) : null}
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    ⚖️ {item.quantityAffected?.toLocaleString('pt-BR')} kg
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                    Origem: ERP Corporativo
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.severity === 'severa' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    item.severity === 'moderada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.severity}
                  </span>
                </div>
              </div>

              {/* Defect Name and Detailed Description */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-200 text-sm">
                  {item.defectTypeName}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  "{item.description}"
                </p>
              </div>

              {/* Root Cause & Corrective Action */}
              {(item.rootCause || item.correctiveAction) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {item.rootCause && (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        Causa Raiz Identificada:
                      </div>
                      <div className="text-slate-300 mt-1">{item.rootCause}</div>
                    </div>
                  )}
                  {item.correctiveAction && (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Ação Corretiva Aplicada:
                      </div>
                      <div className="text-slate-300 mt-1">{item.correctiveAction}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Gallery */}
              {item.photos && item.photos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Fotos Anexadas ({item.photos.length}):
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {item.photos.map(photo => (
                      <div
                        key={photo.id}
                        onClick={() => {
                          setActivePhoto(photo);
                          setPhotoTitle(`${item.customerName} - [${item.code}] ${item.bales?.length ? `Fardos ${item.bales.join(', ')}` : item.lotNumber || ''}`);
                        }}
                        className="relative group cursor-pointer w-32 h-24 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all bg-black shadow-md"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye className="w-5 h-5 text-cyan-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {activePhoto && (
        <PhotoViewerModal
          photo={activePhoto}
          title={photoTitle}
          onClose={() => setActivePhoto(null)}
        />
      )}

      <NewComplaintModal
        isOpen={isNewComplaintModalOpen}
        onClose={() => setIsNewComplaintModalOpen(false)}
      />

      <DefectManagementModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
      />
    </div>
  );
}
