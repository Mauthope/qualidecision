'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import { Send, CheckCircle2, Clock, AlertTriangle, ArrowRight, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { ConcessionShipment } from '@/types';

export const RecentConcessionsTable: React.FC = () => {
  const { concessions, complaints, deleteConcession } = useQuality();
  const [isNewConcessionOpen, setIsNewConcessionOpen] = useState(false);
  const [concessionToDelete, setConcessionToDelete] = useState<ConcessionShipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Últimos Envios com Concessão Registrados
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe os lotes liberados com desvios e o parecer de recebimento
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

        {/* Table Content */}
        {concessions.length === 0 ? (
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-900/30 rounded-xl border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <Send className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200 font-heading">
                Nenhum envio com concessão registrado ainda
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O sistema está limpo e sincronizado para operações reais. Registre o primeiro lote com desvio/concessão para acompanhar a aceitação e o refugo evitado.
              </p>
            </div>
            <button
              onClick={() => setIsNewConcessionOpen(true)}
              className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Novo Envio com Desvio / Concessão</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pr-4">Código / Data</th>
                  <th className="pb-3 px-4">Cliente Destino</th>
                  <th className="pb-3 px-4">Produto & Fardos</th>
                  <th className="pb-3 px-4">Defeito & Severidade</th>
                  <th className="pb-3 px-4 text-right">Volume Concedido</th>
                  <th className="pb-3 px-4 text-right">Scrap Salvo (R$)</th>
                  <th className="pb-3 px-4 text-center">Status / Feedback</th>
                  <th className="pb-3 pl-2 pr-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {concessions.slice(0, 6).map(item => {
                  const isReclaimed = complaints.some(
                    comp => comp.customerId === item.customerId && (
                      (comp.lotNumber && item.lotNumber && comp.lotNumber.toLowerCase().includes(item.lotNumber.toLowerCase())) ||
                      (comp.defectTypeId === item.defectTypeId && new Date(comp.date) >= new Date(item.date))
                    )
                  ) || item.customerFeedbackStatus === 'reclamado_posteriormente';

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Clock className="w-3 h-3" />
                      Em Trânsito
                    </span>
                  );

                  if (isReclaimed) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        Reclamado Posteriormente
                      </span>
                    );
                  } else if (item.customerFeedbackStatus === 'aceito_sem_ressalvas') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Aceito sem queixa
                      </span>
                    );
                  } else if (item.customerFeedbackStatus === 'aceito_com_observacao') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Aceito c/ obs
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        isReclaimed
                          ? 'bg-rose-950/30 hover:bg-rose-950/40'
                          : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="py-3.5 pr-4">
                        <div className="font-mono font-bold text-cyan-400">{item.code}</div>
                        <div className="text-[11px] text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <Link href={`/clientes/${item.customerId}`} className="hover:text-cyan-300 transition-colors">
                          {item.customerName}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-bold flex flex-wrap items-center gap-1.5">
                          <span>{item.productName}</span>
                          {item.opNumber && (
                            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                              {item.opNumber}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.bales && item.bales.length > 0 ? (
                            <span className="text-[10px] font-mono font-medium text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50" title={`Fardos: ${item.bales.join(', ')}`}>
                              📦 {item.bales.length} fardo{item.bales.length > 1 ? 's' : ''}: {item.bales.slice(0, 4).join(', ')}{item.bales.length > 4 ? ` (+${item.bales.length - 4})` : ''}
                            </span>
                          ) : item.lotNumber ? (
                            <span>{item.lotNumber.startsWith('Fardo') ? item.lotNumber : `Fardo/Lote: ${item.lotNumber}`}</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold">{item.defectTypeName}</div>
                        <span className={`text-[10px] uppercase font-bold ${
                          item.severity === 'severa' ? 'text-rose-400' : item.severity === 'moderada' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          Gravidade {item.severity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        {item.quantity.toLocaleString('pt-BR')} un
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        R$ {item.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {statusBadge}
                      </td>

                      <td className="py-3.5 pl-2 pr-4 text-center">
                        <button
                          type="button"
                          onClick={() => setConcessionToDelete(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                          title={`Excluir envio ${item.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isNewConcessionOpen && (
        <NewConcessionModal isOpen={isNewConcessionOpen} onClose={() => setIsNewConcessionOpen(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {concessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Excluir Envio com Concessão
                </h3>
                <p className="text-xs text-slate-400">
                  Esta ação removerá o registro e atualizará os indicadores.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Código do Envio:</span>
                <span className="font-mono font-bold text-cyan-400">{concessionToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-semibold text-slate-200">{concessionToDelete.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Produto:</span>
                <span className="text-slate-300">{concessionToDelete.productName}</span>
              </div>
              {concessionToDelete.bales && concessionToDelete.bales.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Fardo(s):</span>
                  <span className="font-mono text-cyan-300">{concessionToDelete.bales.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Volume:</span>
                <span className="font-mono text-slate-200">{concessionToDelete.quantity.toLocaleString('pt-BR')} un</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data do Envio:</span>
                <span className="text-slate-300">{new Date(concessionToDelete.date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <p className="text-xs text-rose-300/90 bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40">
              ⚠️ <strong>Atenção:</strong> A exclusão é definitiva no sistema e no banco de dados.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConcessionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteConcession(concessionToDelete.id);
                    setConcessionToDelete(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
