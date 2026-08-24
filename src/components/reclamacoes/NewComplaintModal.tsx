'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import { DefectSeverity } from '@/types';
import { AlertCircle, X, Image as ImageIcon, Plus, Trash2, Camera } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    caption: 'Falha visual de pigmento e decalque na sacaria',
    defectLocation: 'Painel frontal'
  },
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    caption: 'Borrão de impressão na área do código de barras',
    defectLocation: 'Borda inferior'
  },
  {
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
    caption: 'Ponto de costura rompido na boca de fechamento',
    defectLocation: 'Boca superior'
  },
  {
    url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80',
    caption: 'Desfiamento de filamentos na alça de sustentação',
    defectLocation: 'Alça lateral'
  }
];

export const NewComplaintModal: React.FC<Props> = ({ isOpen, onClose, defaultCustomerId }) => {
  const { customers, defects, addComplaint } = useQuality();

  const [customerId, setCustomerId] = useState(defaultCustomerId || (customers[0]?.id || ''));
  const [defectTypeId, setDefectTypeId] = useState(defects[0]?.id || '');
  const [lotNumber, setLotNumber] = useState(`LT-2026-${Math.floor(700 + Math.random() * 299)}`);
  const [quantityAffected, setQuantityAffected] = useState<number>(1000);
  const [severity, setSeverity] = useState<DefectSeverity>('severa');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [origin, setOrigin] = useState<'sac_manual' | 'erp_sync'>('sac_manual');
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; caption: string; defectLocation?: string }>>([
    {
      id: `p-${Date.now()}`,
      url: SAMPLE_PHOTO_PRESETS[0].url,
      caption: SAMPLE_PHOTO_PRESETS[0].caption,
      defectLocation: SAMPLE_PHOTO_PRESETS[0].defectLocation
    }
  ]);

  if (!isOpen) return null;

  const handleAddPresetPhoto = (preset: typeof SAMPLE_PHOTO_PRESETS[0]) => {
    setPhotos(prev => [
      ...prev,
      {
        id: `p-${Date.now()}-${Math.random()}`,
        url: preset.url,
        caption: preset.caption,
        defectLocation: preset.defectLocation
      }
    ]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !defectTypeId || !description.trim()) return;

    addComplaint({
      customerId,
      lotNumber: lotNumber.trim(),
      defectTypeId,
      quantityAffected,
      severity,
      description: description.trim(),
      rootCause: rootCause.trim(),
      correctiveAction: correctiveAction.trim(),
      origin,
      photos
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">Registrar Reclamação de Cliente (SAC / ERP)</h3>
              <p className="text-xs text-slate-400">Cadastro de não-conformidade com laudo e fotos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cliente Reclamante *
              </label>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
                required
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Defect Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Não-Conformidade *
              </label>
              <select
                value={defectTypeId}
                onChange={e => setDefectTypeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
                required
              >
                {defects.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lot */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lote Reclamado *
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={e => setLotNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50 font-mono"
                required
              />
            </div>

            {/* Quantity Affected */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantidade Afetada
              </label>
              <input
                type="number"
                min={1}
                value={quantityAffected}
                onChange={e => setQuantityAffected(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none font-mono"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gravidade *
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as DefectSeverity)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
              >
                <option value="severa">Severa (Impacto operacional/devolução)</option>
                <option value="moderada">Moderada (Reclamação com retenção)</option>
                <option value="leve">Leve (Notificação formal)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição Detalhada do Problema / Relato do Cliente *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Tinta preta borrada no código de barras e tabela nutricional, impedindo leitura ótica no armazém..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500/50"
              required
            />
          </div>

          {/* Root cause and action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Causa Raiz Apurada
              </label>
              <input
                type="text"
                value={rootCause}
                onChange={e => setRootCause(e.target.value)}
                placeholder="Ex: Rolo anilox com excesso de viscosidade..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ação Corretiva / Disposição
              </label>
              <input
                type="text"
                value={correctiveAction}
                onChange={e => setCorrectiveAction(e.target.value)}
                placeholder="Ex: Troca preventiva de navalhas / reposição de lote..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Photos Management */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                Evidências Fotográficas Anexadas ({photos.length})
              </label>
            </div>

            {/* Photo List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {photos.map(p => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                  <img src={p.url} alt={p.caption} className="w-full h-20 object-cover" />
                  <div className="p-1.5 text-[10px] text-slate-300 truncate">{p.caption}</div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(p.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-rose-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500">Adicionar foto de amostra:</span>
              {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPresetPhoto(preset)}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Foto {idx + 1}: {preset.caption.slice(0, 18)}...
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Salvar Reclamação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
