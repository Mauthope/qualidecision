'use client';

import React, { useState } from 'react';
import { Customer, Complaint, ComplaintPhoto } from '@/types';
import { AlertCircle, Camera, Eye, Calendar, Wrench, CheckCircle2, Database } from 'lucide-react';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';

interface Props {
  customer: Customer;
  complaints: Complaint[];
}

export const CustomerComplaintHistory: React.FC<Props> = ({ customer, complaints }) => {
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');

  return (
    <>
      <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Histórico de Reclamações & Não-Conformidades
              </h3>
              <p className="text-xs text-slate-400">
                Laudos, fotos de amostras e causas raízes registradas para {customer.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alimentado via ERP</span>
          </div>
        </div>

        {/* Complaints Timeline / List */}
        {complaints.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <p className="font-semibold text-slate-400">Nenhuma não-conformidade registrada para este cliente!</p>
            <p className="text-[11px]">O histórico do ERP está 100% limpo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Top Row: Code, Date, Lot, Severity */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      {item.code}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Lote: <strong className="font-mono text-cyan-300">{item.lotNumber}</strong>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ⚖️ {item.quantityAffected?.toLocaleString('pt-BR')} kg
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.severity === 'severa' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      item.severity === 'moderada' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      Gravidade {item.severity}
                    </span>
                  </div>
                </div>

                {/* Defect Title and Description */}
                <div>
                  <div className="font-bold text-slate-200 text-xs sm:text-sm">
                    {item.defectTypeName}
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mt-1.5 leading-relaxed">
                    "{item.description}"
                  </p>
                </div>

                {/* Root Cause & Corrective Action */}
                {(item.rootCause || item.correctiveAction) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {item.rootCause && (
                      <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-amber-400" />
                          Causa Raiz:
                        </div>
                        <div className="text-slate-300 mt-0.5">{item.rootCause}</div>
                      </div>
                    )}
                    {item.correctiveAction && (
                      <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ação Corretiva:
                        </div>
                        <div className="text-slate-300 mt-0.5">{item.correctiveAction}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Photo Gallery */}
                {item.photos && item.photos.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      Evidências Fotográficas ({item.photos.length}):
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {item.photos.map(photo => (
                        <div
                          key={photo.id}
                          onClick={() => {
                            setActivePhoto(photo);
                            setPhotoTitle(`${customer.name} - ${item.code} (Lote ${item.lotNumber})`);
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
              </div>
            ))}
          </div>
        )}
      </div>

      {activePhoto && (
        <PhotoViewerModal
          photo={activePhoto}
          title={photoTitle}
          onClose={() => setActivePhoto(null)}
        />
      )}
    </>
  );
};
