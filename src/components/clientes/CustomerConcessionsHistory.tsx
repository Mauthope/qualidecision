'use client';

import React, { useState } from 'react';
import { Customer, Complaint, ConcessionShipment, ComplaintPhoto } from '@/types';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileWarning,
  ShieldCheck,
  Package,
  DollarSign,
  UserCheck,
  Camera,
  Eye,
  Image as ImageIcon,
  Trash2,
  Pencil
} from 'lucide-react';
import { useQuality } from '@/context/QualityContext';
import { useAuth } from '@/context/AuthContext';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { EditConcessionModal } from '@/components/envios/EditConcessionModal';

interface Props {
  customer: Customer;
  concessions: ConcessionShipment[];
  complaints: Complaint[];
}

export const CustomerConcessionsHistory: React.FC<Props> = ({
  customer,
  concessions,
  complaints
}) => {
  const { deleteConcession } = useQuality();
  const { canDelete, canEdit } = useAuth();
  const [concessionToEdit, setConcessionToEdit] = useState<ConcessionShipment | null>(null);
  const [concessionToDelete, setConcessionToDelete] = useState<ConcessionShipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  // Map concessions and check if there are complaints from the shipment date onwards
  const analyzedConcessions = concessions.map(c => {
    const shipmentDate = new Date(c.date);

    // Find any complaint by this customer for the SAME defect on or after the shipment date
    const sameDefectLaterComplaint = complaints.find(comp => {
      if (comp.customerId !== customer.id) return false;
      const compDate = new Date(comp.date);
      // Same defect type AND complaint date is on or after the concession shipment date
      return comp.defectTypeId === c.defectTypeId && compDate >= shipmentDate;
    });

    // Or exact lot match or bale match
    const lotMatchComplaint = complaints.find(comp => {
      if (comp.customerId !== customer.id) return false;
      const lotMatches = Boolean(
        comp.lotNumber &&
        c.lotNumber &&
        (comp.lotNumber.toLowerCase().includes(c.lotNumber.toLowerCase()) ||
         c.lotNumber.toLowerCase().includes(comp.lotNumber.toLowerCase()))
      );
      const baleMatches = Boolean(
        comp.bales &&
        c.bales &&
        comp.bales.some(b => c.bales?.includes(b))
      );
      return lotMatches || baleMatches;
    });

    const subsequentComplaint = sameDefectLaterComplaint || lotMatchComplaint || (
      c.customerFeedbackStatus === 'reclamado_posteriormente' ? complaints.find(comp => comp.customerId === customer.id) : null
    );

    const isReclaimedAfterShipment = Boolean(
      c.customerFeedbackStatus === 'reclamado_posteriormente' ||
      sameDefectLaterComplaint ||
      lotMatchComplaint
    );

    return {
      ...c,
      isReclaimedAfterShipment,
      subsequentComplaint
    };
  });

  const totalConcessions = concessions.length;
  const reclaimedCount = analyzedConcessions.filter(c => c.isReclaimedAfterShipment).length;
  const successfulCount = totalConcessions - reclaimedCount;

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/85 border border-slate-800/90 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Histórico de Lotes Concedidos Enviados a Este Cliente
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {totalConcessions} Envio(s)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rastreamento de lotes liberados com concessão e monitoramento de reclamações pós-envio
            </p>
          </div>
        </div>

        {/* Quick summary counters */}
        {reclaimedCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{reclaimedCount} Reclamado(s) Pós-Envio</span>
            </span>
          </div>
        )}
      </div>

      {/* List of Concessions Blocks */}
      {totalConcessions === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
          Nenhuma concessão enviada para este cliente até o momento.
        </div>
      ) : (
        <div className="space-y-4">
          {analyzedConcessions.map((item, idx) => {
            const isReclaimed = item.isReclaimedAfterShipment;
            const complaint = item.subsequentComplaint;

            return (
              <div
                key={item.id || idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 ${
                  isReclaimed
                    ? 'bg-rose-950/30 border-2 border-rose-500/70 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                    : 'bg-slate-900/50 border border-emerald-500/40 hover:border-emerald-500/60'
                }`}
              >
                {/* Block Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        isReclaimed
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {item.code}
                    </span>

                    <span className="text-sm font-bold text-white">
                      {item.productName}
                    </span>

                    {item.opNumber && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-500/20">
                        {item.opNumber}
                      </span>
                    )}

                    {item.bales && item.bales.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50" title={`Fardos: ${item.bales.join(', ')}`}>
                        📦 {item.bales.length} fardo{item.bales.length > 1 ? 's' : ''}: {item.bales.slice(0, 4).join(', ')}{item.bales.length > 4 ? ` (+${item.bales.length - 4})` : ''}
                      </span>
                    ) : item.lotNumber ? (
                      <span className="text-xs text-slate-400 font-mono">
                        ({item.lotNumber.startsWith('Fardo') ? item.lotNumber : `Lote: ${item.lotNumber}`})
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Data de Envio: <strong className="text-slate-200">{new Date(item.date).toLocaleDateString('pt-BR')}</strong>
                    </span>

                    {isReclaimed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-900/50 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                        RECLAMADO APÓS ENVIO
                      </span>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setConcessionToEdit(item)}
                        className="p-1 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-500/20 border border-cyan-500/30 bg-cyan-950/40 shadow-sm shadow-cyan-950/50 transition-all cursor-pointer ml-1"
                        title={`Editar envio ${item.code}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConcessionToDelete(item)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer ml-1"
                        title={`Excluir envio ${item.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Desvio Concedido:</span>
                    <strong className="text-slate-100 text-xs mt-0.5 block">{item.defectTypeName}</strong>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">{item.severity}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Volume Concedido:</span>
                    <strong className="font-mono text-cyan-400 text-xs mt-0.5 block">
                      {item.quantity.toLocaleString('pt-BR')} un
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Scrap Salvo Estimado:</span>
                    <strong className="font-mono text-emerald-400 text-xs mt-0.5 block">
                      R$ {item.totalSavedValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Liberado Por:</span>
                    <span className="text-slate-300 text-xs mt-0.5 block truncate">{item.approvedBy}</span>
                  </div>
                </div>

                {/* Concession Photos Gallery */}
                {item.photos && item.photos.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Evidências Fotográficas do Desvio Concedido ({item.photos.length}):</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {item.photos.map(photo => (
                        <div
                          key={photo.id}
                          onClick={() => {
                            setActivePhoto(photo);
                            const balesInfo = item.bales?.length ? 'Fardos ' + item.bales.join(', ') : (item.lotNumber || '');
                            setPhotoTitle(`Concessão ${item.code} - ${item.defectTypeName} (${balesInfo})`);
                          }}
                          className="relative group cursor-pointer w-28 h-20 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all bg-black shadow-md"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4 text-cyan-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical notes */}
                {item.technicalNotes && (
                  <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 font-semibold">Parecer da Liberação: </span>
                    {item.technicalNotes}
                  </div>
                )}

                {/* CONDITIONAL CALLOUT: RED IF RECLAIMED AFTER SHIPMENT */}
                {isReclaimed && complaint ? (
                  <div className="p-4 rounded-xl bg-rose-950/50 border-2 border-rose-500/60 text-xs text-rose-100 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                      <FileWarning className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>🚨 AVISO: Reclamação aberta pelo cliente a partir da data de envio!</span>
                    </div>

                    <p className="text-xs leading-relaxed text-rose-200/95">
                      Este lote foi expedido em <strong>{new Date(item.date).toLocaleDateString('pt-BR')}</strong> com aprovação de desvio de <strong>{item.defectTypeName}</strong>.
                      No entanto, em <strong>{new Date(complaint.date).toLocaleDateString('pt-BR')}</strong> (posterior ao envio), o cliente registrou formalmente o chamado <strong>{complaint.code}</strong> no SAC do ERP para o mesmo desvio de <strong>{complaint.defectTypeName}</strong> ({complaint.quantityAffected ? `${complaint.quantityAffected.toLocaleString('pt-BR')} kg` : 'peso sob análise'} afetados).
                    </p>

                    <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/30 text-[11px] font-mono text-rose-300 italic">
                      Laudo do SAC no ERP: "{complaint.description}"
                    </div>

                    {/* Complaint Photo Gallery */}
                    {complaint.photos && complaint.photos.length > 0 && (
                      <div className="pt-2 border-t border-rose-500/30 space-y-1.5">
                        <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-rose-400" />
                          <span>Evidências Fotográficas do SAC Reclamado ({complaint.photos.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {complaint.photos.map(photo => (
                            <div
                              key={photo.id}
                              onClick={() => {
                                setActivePhoto(photo);
                                setPhotoTitle(`SAC ${complaint.code} - ${complaint.defectTypeName} (Lote ${complaint.lotNumber})`);
                              }}
                              className="relative group cursor-pointer w-28 h-20 rounded-xl overflow-hidden border border-rose-500/50 hover:border-rose-300 transition-all bg-black shadow-md"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-4 h-4 text-rose-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !isReclaimed ? (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Concessão Bem-Sucedida:</strong> Nenhuma reclamação de <strong>{item.defectTypeName}</strong> foi aberta pelo cliente após a data de envio (<strong>{new Date(item.date).toLocaleDateString('pt-BR')}</strong>). Material faturado e absorvido sem queixas.
                    </span>
                  </div>
                ) : null}

              </div>
            );
          })}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {activePhoto && (
        <PhotoViewerModal
          photo={activePhoto}
          title={photoTitle}
          onClose={() => setActivePhoto(null)}
        />
      )}

      {concessionToEdit && (
        <EditConcessionModal
          isOpen={!!concessionToEdit}
          concession={concessionToEdit}
          onClose={() => setConcessionToEdit(null)}
        />
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
    </div>
  );
};
