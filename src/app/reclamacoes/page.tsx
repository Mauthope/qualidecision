'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import {
  AlertCircle,
  Search,
  Camera,
  Eye,
  Calendar,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Database,
  Layers
} from 'lucide-react';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { ComplaintPhoto } from '@/types';

export default function ReclamacoesPage() {
  const { complaints, customers, showToast } = useQuality();
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.defectTypeName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const matchesCustomer = filterCustomer === 'all' || c.customerId === filterCustomer;
    const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;

    return matchesSearch && matchesCustomer && matchesSeverity;
  });

  const handleSyncErp = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Base de reclamações sincronizada com sucesso com o banco ERP corporativo!', 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold mb-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alimentado Automaticamente via ERP Corporativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Reclamações & Não-Conformidades de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Registro de ocorrências, laudos e fotos de não-conformidades integradas diretamente do banco da empresa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleSyncErp}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com ERP'}</span>
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
                  <span className="text-xs text-slate-400">
                    (Lote <strong className="font-mono text-cyan-300">{item.lotNumber}</strong>)
                  </span>
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
                    Fotos Anexadas do Lote ({item.photos.length}):
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {item.photos.map(photo => (
                      <div
                        key={photo.id}
                        onClick={() => {
                          setActivePhoto(photo);
                          setPhotoTitle(`${item.customerName} - [${item.code}] Lote ${item.lotNumber}`);
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
    </div>
  );
}
