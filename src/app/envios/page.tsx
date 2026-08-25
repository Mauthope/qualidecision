'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import {
  Send,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  PackageCheck,
  Filter,
  Download,
  Camera,
  Eye
} from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { ComplaintPhoto } from '@/types';

export default function EnviosPage() {
  const { concessions, complaints, customers, defects, stats, showToast } = useQuality();
  const [isNewConcessionOpen, setIsNewConcessionOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [search, setSearch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterDefect, setFilterDefect] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredConcessions = concessions.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.defectTypeName.toLowerCase().includes(search.toLowerCase());

    const matchesCustomer = filterCustomer === 'all' || c.customerId === filterCustomer;
    const matchesDefect = filterDefect === 'all' || c.defectTypeId === filterDefect;
    const matchesStatus = filterStatus === 'all' || c.customerFeedbackStatus === filterStatus;

    return matchesSearch && matchesCustomer && matchesDefect && matchesStatus;
  });

  const exportCsv = () => {
    const headers = ['Codigo', 'Data', 'Cliente', 'Lote', 'Produto', 'Defeito', 'Quantidade', 'Severidade', 'Scrap_Salvo_RS', 'Status'];
    const rows = filteredConcessions.map(c => [
      c.code,
      c.date,
      `"${c.customerName}"`,
      c.lotNumber,
      `"${c.productName}"`,
      `"${c.defectTypeName}"`,
      c.quantity,
      c.severity,
      c.totalSavedValue.toFixed(2),
      c.customerFeedbackStatus
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `envios_concessoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Planilha CSV de concessões exportada!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-1.5">
            <Send className="w-3.5 h-3.5" />
            <span>Gestão de Envios & Concessões de Qualidade</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Lotes Expedidos com Desvio / Refugo Evitado
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Registro de concessões aprovadas para recuperação financeira de materiais e acompanhamento de aceitação.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsNewConcessionOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Envio com Desvio</span>
          </button>
        </div>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glow-card p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total de Unidades Concedidas</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {stats.totalUnitsSaved.toLocaleString('pt-BR')} sacarias/bags
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glow-card p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Scrap Evitado (Lucro Salvo)</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              R$ {stats.totalSavedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glow-card p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Taxa de Sucesso / Aceite</div>
            <div className="text-xl font-bold font-mono text-teal-300 mt-0.5">
              {stats.acceptanceRate.toFixed(1)}% aprovados
            </div>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glow-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por lote, código, cliente ou defeito..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
            value={filterDefect}
            onChange={e => setFilterDefect(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Defeitos</option>
            {defects.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="aceito_sem_ressalvas">Aceito sem Queixa</option>
            <option value="aceito_com_observacao">Aceito c/ Observação</option>
            <option value="em_transito">Em Trânsito</option>
          </select>
        </div>
      </div>

      {/* Concessions Table */}
      <div className="glow-card p-5 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="pb-3 pr-4">Código / Data</th>
                <th className="pb-3 px-4">Cliente Destino</th>
                <th className="pb-3 px-4">Produto & Lote</th>
                <th className="pb-3 px-4">Defeito Concedido</th>
                <th className="pb-3 px-4">Evidência Fotográfica</th>
                <th className="pb-3 px-4 text-right">Volume</th>
                <th className="pb-3 px-4 text-right">Scrap Salvo</th>
                <th className="pb-3 px-4">Parecer Técnico</th>
                <th className="pb-3 pl-4 text-center">Status / Aceite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredConcessions.map(c => {
                const isReclaimed = complaints.some(
                  comp => comp.customerId === c.customerId && (
                    (comp.lotNumber && c.lotNumber && comp.lotNumber.toLowerCase().includes(c.lotNumber.toLowerCase())) ||
                    (comp.defectTypeId === c.defectTypeId && new Date(comp.date) >= new Date(c.date))
                  )
                ) || c.customerFeedbackStatus === 'reclamado_posteriormente';

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isReclaimed
                        ? 'bg-rose-950/30 hover:bg-rose-950/40'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <div className="font-mono font-bold text-cyan-400">{c.code}</div>
                      <div className="text-[11px] text-slate-500">{new Date(c.date).toLocaleDateString('pt-BR')}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <Link href={`/clientes/${c.customerId}`} className="hover:text-cyan-300 transition-colors font-semibold">
                        {c.customerName}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{c.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">Lote: {c.lotNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-semibold">{c.defectTypeName}</div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">{c.severity}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.photos && c.photos.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {c.photos.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setActivePhoto(p);
                                setPhotoTitle(`Concessão ${c.code} - ${c.defectTypeName} (Lote ${c.lotNumber})`);
                              }}
                              className="relative group w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 shrink-0 transition-all cursor-pointer bg-black"
                            >
                              <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-cyan-300" />
                              </div>
                            </button>
                          ))}
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {c.photos.length} foto(s)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Sem anexo</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                      {c.quantity.toLocaleString('pt-BR')} un
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      R$ {c.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {c.technicalNotes}
                    </td>

                    <td className="py-3.5 pl-4 text-center">
                      {isReclaimed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Reclamado Posteriormente
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          c.customerFeedbackStatus === 'aceito_sem_ressalvas' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          c.customerFeedbackStatus === 'aceito_com_observacao' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          {c.customerFeedbackStatus === 'aceito_sem_ressalvas' && <CheckCircle2 className="w-3 h-3" />}
                          {c.customerFeedbackStatus === 'aceito_com_observacao' && <AlertTriangle className="w-3 h-3" />}
                          {c.customerFeedbackStatus === 'em_transito' && <Clock className="w-3 h-3" />}
                          <span>{c.customerFeedbackStatus.replace(/_/g, ' ')}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isNewConcessionOpen && (
        <NewConcessionModal isOpen={isNewConcessionOpen} onClose={() => setIsNewConcessionOpen(false)} />
      )}

      {/* Photo Viewer Modal */}
      {activePhoto && (
        <PhotoViewerModal
          photo={activePhoto}
          title={photoTitle}
          onClose={() => setActivePhoto(null)}
        />
      )}
    </div>
  );
}
