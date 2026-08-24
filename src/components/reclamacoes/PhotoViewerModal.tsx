'use client';

import React from 'react';
import { ComplaintPhoto } from '@/types';
import { X, ZoomIn, MapPin, Image as ImageIcon } from 'lucide-react';

interface Props {
  photo: ComplaintPhoto | null;
  onClose: () => void;
  title?: string;
}

export const PhotoViewerModal: React.FC<Props> = ({ photo, onClose, title }) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Evidência Fotográfica de Qualidade</h3>
              <p className="text-xs text-slate-400">{title || 'Não-conformidade registrada no SAC'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[350px] max-h-[65vh] overflow-hidden">
          <img
            src={photo.url}
            alt={photo.caption}
            className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
          />
        </div>

        {/* Footer Info */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-200">{photo.caption}</div>
            {photo.defectLocation && (
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Localização no produto: <strong>{photo.defectLocation}</strong></span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-end sm:self-auto"
          >
            Fechar Visualizador
          </button>
        </div>
      </div>
    </div>
  );
};
