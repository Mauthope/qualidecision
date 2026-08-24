'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import { Database, Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, X, CloudSync } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { exportData, importData, resetData, showToast } = useQuality();
  const [importJson, setImportJson] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qualidecision_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  };

  const handleImportJson = () => {
    if (!importJson.trim()) return;
    const ok = importData(importJson);
    if (ok) {
      setImportJson('');
      onClose();
    }
  };

  const handleSimulateErpSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Sincronização com o Banco de Dados ERP concluída (Tabelas SAC atualizadas)!', 'success');
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar os dados originais de demonstração?')) {
      resetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Banco de Dados & Sincronização</h3>
              <p className="text-xs text-slate-400">Camada de persistência LocalStorage (Supabase Ready)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* ERP Sync Simulation */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sincronização ERP Empresa
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simula a ingestão direta de reclamações e pedidos do banco corporativo.
              </p>
            </div>
            <button
              onClick={handleSimulateErpSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar ERP'}
            </button>
          </div>

          {/* Backup Download */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">Exportar Backup Completo</div>
              <p className="text-xs text-slate-400">Salva clientes, tolerâncias, envios e histórico em arquivo .json</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar JSON
            </button>
          </div>

          {/* Import JSON */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Restaurar ou Importar JSON de Dados
            </label>
            <textarea
              rows={3}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder="Cole o código JSON do backup aqui..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
            />
            {importJson && (
              <button
                onClick={handleImportJson}
                className="w-full py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Processar e Importar
              </button>
            )}
          </div>

          {/* Reset factory data */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Restaurar dados padrão de fábrica</span>
            <button
              onClick={handleReset}
              className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Demonstração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
