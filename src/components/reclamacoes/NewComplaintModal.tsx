'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import { DefectSeverity, ComplaintPhoto } from '@/types';
import { AlertCircle, X, PlusCircle, UserPlus } from 'lucide-react';
import { PhotoUploadCamera } from '@/components/common/PhotoUploadCamera';
import { SearchableCustomerSelect } from '@/components/common/SearchableCustomerSelect';
import { SearchableDefectSelect } from '@/components/common/SearchableDefectSelect';
import { BaleListInput } from '@/components/common/BaleListInput';
import { NewCustomerModal } from '@/components/clientes/NewCustomerModal';
import { NewDefectModal } from '@/components/defeitos/NewDefectModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
}

export const NewComplaintModal: React.FC<Props> = ({ isOpen, onClose, defaultCustomerId }) => {
  const { customers, defects, addComplaint } = useQuality();

  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [date, setDate] = useState('');
  const [defectTypeId, setDefectTypeId] = useState('');
  const [bales, setBales] = useState<string[]>([]);
  const [quantityAffected, setQuantityAffected] = useState<number | ''>('');
  const [severity, setSeverity] = useState<DefectSeverity>('severa');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [origin, setOrigin] = useState<'sac_manual' | 'erp_sync'>('sac_manual');
  const [photos, setPhotos] = useState<ComplaintPhoto[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectModalInitialName, setDefectModalInitialName] = useState('');

  // Limpa todos os campos ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setCustomerId(defaultCustomerId || '');
      setDate('');
      setDefectTypeId('');
      setBales([]);
      setQuantityAffected('');
      setSeverity('severa');
      setDescription('');
      setRootCause('');
      setCorrectiveAction('');
      setPhotos([]);
    }
  }, [isOpen, defaultCustomerId]);

  const numQuantity = typeof quantityAffected === 'number' ? quantityAffected : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !defectTypeId || !description.trim() || bales.length === 0 || !date || numQuantity <= 0) return;

    addComplaint({
      customerId,
      date,
      bales,
      defectTypeId,
      quantityAffected: numQuantity,
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
              <h3 className="text-base font-bold text-white font-heading">Acrescentar Reclamação de Cliente (SAC)</h3>
              <p className="text-xs text-slate-400">Cadastro manual de não-conformidade com laudo técnico e fotos</p>
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
            {/* Customer with Search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Cliente Reclamante *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Novo Cliente</span>
                </button>
              </div>
              <SearchableCustomerSelect
                customers={customers}
                selectedCustomerId={customerId}
                onSelectCustomer={setCustomerId}
                placeholder="Pesquisar cliente por nome ou código..."
                required
              />
            </div>

            {/* Defect Type with Search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Tipo de Não-Conformidade *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDefectModalInitialName('');
                    setIsDefectModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Novo Defeito</span>
                </button>
              </div>
              <SearchableDefectSelect
                defects={defects}
                selectedDefectId={defectTypeId}
                onSelectDefect={setDefectTypeId}
                onCreateNew={term => {
                  setDefectModalInitialName(term || '');
                  setIsDefectModalOpen(true);
                }}
                placeholder="Selecione o defeito / problema..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Data da Reclamação */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Data da Ocorrência *
                </label>
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split('T')[0])}
                  className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  [Hoje]
                </button>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50 [color-scheme:dark]"
              />
            </div>

            {/* Quantity Affected in Kg */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Peso / Qtd Reclamada (Kg) *
              </label>
              <input
                type="number"
                min={0.1}
                step="any"
                value={quantityAffected}
                onChange={e => setQuantityAffected(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                placeholder="Ex: 500"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none font-mono"
                required
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
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="severa">Severa (Devolução)</option>
                <option value="moderada">Moderada (Retenção)</option>
                <option value="leve">Leve (Notificação)</option>
              </select>
            </div>
          </div>

          {/* Fardos Reclamados (Adição dinâmica por botão) */}
          <BaleListInput
            bales={bales}
            onChange={setBales}
            variant="rose"
            required={true}
            label="Número do(s) Fardo(s) Reclamado(s) *"
            helperText="Adicione o número de cada fardo reclamado com o botão '+ Add Fardo' (ou intervalos como 101-105 / cole do Excel)."
          />

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

          {/* Direct Camera / File Upload for Complaint Evidence */}
          <PhotoUploadCamera
            photos={photos}
            onPhotosChange={setPhotos}
            label="Evidências Fotográficas da Não-Conformidade"
            maxPhotos={6}
          />

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
              disabled={!customerId || !defectTypeId || !description.trim() || bales.length === 0 || !date || numQuantity <= 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Salvar Reclamação
            </button>
          </div>
        </form>
      </div>

      {/* Quick Customer Registration Modal */}
      {isCustomerModalOpen && (
        <NewCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={newCust => {
            setCustomerId(newCust.id);
          }}
        />
      )}

      {/* Quick Defect Registration Modal */}
      {isDefectModalOpen && (
        <NewDefectModal
          isOpen={isDefectModalOpen}
          onClose={() => setIsDefectModalOpen(false)}
          onSuccess={newDef => {
            setDefectTypeId(newDef.id);
          }}
          initialName={defectModalInitialName}
        />
      )}
    </div>
  );
};
