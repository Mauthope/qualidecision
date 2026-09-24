'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import { ConcessionShipment, DefectSeverity, ComplaintPhoto } from '@/types';
import {
  Pencil,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  DollarSign,
  UserPlus,
  PlusCircle,
  Scale,
  Building2,
  FileText
} from 'lucide-react';
import { NewCustomerModal } from '@/components/clientes/NewCustomerModal';
import { NewDefectModal } from '@/components/defeitos/NewDefectModal';
import { PhotoUploadCamera } from '@/components/common/PhotoUploadCamera';
import { SearchableCustomerSelect } from '@/components/common/SearchableCustomerSelect';
import { SearchableDefectSelect } from '@/components/common/SearchableDefectSelect';
import { BaleListInput } from '@/components/common/BaleListInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  concession: ConcessionShipment | null;
}

export const EditConcessionModal: React.FC<Props> = ({ isOpen, onClose, concession }) => {
  const { customers, defects, updateConcession, evaluateRisk, settings } = useQuality();

  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [opNumber, setOpNumber] = useState('');
  const [defectTypeId, setDefectTypeId] = useState('');
  const [bales, setBales] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [severity, setSeverity] = useState<DefectSeverity | ''>('');
  const [customerFeedbackStatus, setCustomerFeedbackStatus] = useState<ConcessionShipment['customerFeedbackStatus']>('em_transito');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [photos, setPhotos] = useState<ComplaintPhoto[]>([]);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectModalInitialName, setDefectModalInitialName] = useState('');

  // Populate state when concession changes or modal opens
  useEffect(() => {
    if (isOpen && concession) {
      setCustomerId(concession.customerId || '');
      setDate(concession.date || '');
      setOpNumber(concession.opNumber || '');
      setDefectTypeId(concession.defectTypeId || '');
      setBales(Array.isArray(concession.bales) ? concession.bales : []);
      setProductName(concession.productName || 'Sacaria');
      setQuantity(concession.quantity !== undefined ? concession.quantity : '');
      setSeverity(concession.severity || 'leve');
      setCustomerFeedbackStatus(concession.customerFeedbackStatus || 'em_transito');
      setTechnicalNotes(concession.technicalNotes || '');
      setApprovedBy(concession.approvedBy || 'Mauricio Grigol (Qualidade)');
      setPhotos(concession.photos || []);
    }
  }, [isOpen, concession]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedDefect = defects.find(d => d.id === defectTypeId);
  const numQuantity = typeof quantity === 'number' ? quantity : 0;

  // Live Risk Assessment
  const riskResult = useMemo(() => {
    if (!customerId || !defectTypeId || !severity || numQuantity <= 0) return null;
    return evaluateRisk(customerId, defectTypeId, numQuantity, severity);
  }, [customerId, defectTypeId, numQuantity, severity, evaluateRisk]);

  const weightKg = (numQuantity * settings.sackWeightGrams) / 1000;
  const estimatedSavedValue = weightKg * settings.costPerKg;

  if (!isOpen || !concession) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !defectTypeId || !opNumber.trim() || bales.length === 0 || !productName || !severity || !date || numQuantity <= 0) {
      return;
    }

    const selectedCustomer = customers.find(c => c.id === customerId);
    // Preserva rigorosamente o número real já registrado no envio. Se não houver, usa o código do cliente selecionado.
    const preservedCustomerNumber = concession.customerNumber || selectedCustomer?.code;

    updateConcession(concession.id, {
      customerId,
      customerNumber: preservedCustomerNumber,
      opNumber: opNumber.trim(),
      date,
      bales,
      productName: productName.trim(),
      defectTypeId,
      quantity: numQuantity,
      severity,
      customerFeedbackStatus,
      unitSavedValue: (settings.sackWeightGrams / 1000) * settings.costPerKg,
      technicalNotes: technicalNotes.trim() || `Envio autorizado com desvio de ${selectedDefect?.name}.`,
      approvedBy,
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-heading">Editar Envio com Concessão</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                  {concession.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">Atualize dados técnicos, status de recebimento ou parecer técnico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
          
          {/* Customer with Search Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Cliente Destinatário *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* OP Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número da OP *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 00.125.880/01.01"
                value={opNumber}
                onChange={e => setOpNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data do Envio *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Produto *
              </label>
              <select
                required
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Sacaria">Sacaria de Ráfia</option>
                <option value="Big Bag">Big Bag (FIBC)</option>
                <option value="Tecidos Especiais">Tecidos Especiais</option>
                <option value="Laminado">Laminado</option>
                <option value="Bobina">Bobina Técnica</option>
              </select>
            </div>
          </div>

          {/* Individual Bales Tag Input */}
          <BaleListInput
            bales={bales}
            onChange={setBales}
            label="Identificação dos Fardos Concedidos *"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Defect with Search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Desvio / Defeito Concedido *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDefectModalInitialName('');
                    setIsDefectModalOpen(true);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Novo Defeito</span>
                </button>
              </div>
              <SearchableDefectSelect
                defects={defects}
                selectedDefectId={defectTypeId}
                onSelectDefect={setDefectTypeId}
                onCreateNew={(term) => {
                  setDefectModalInitialName(term || '');
                  setIsDefectModalOpen(true);
                }}
                placeholder="Selecione o defeito / desvio..."
                required
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gravidade do Desvio *
              </label>
              <select
                required
                value={severity}
                onChange={e => setSeverity(e.target.value as DefectSeverity)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="leve">Leve (Desvio cosmético ou dimensional sutil)</option>
                <option value="moderada">Moderada (Desvio perceptível sem impacto funcional)</option>
                <option value="severa">Severa (Risco crítico ao processo de envase)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Volume Concedido (Unidades) *
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="Ex: 5000"
                value={quantity}
                onChange={e => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            {/* Customer Feedback Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status / Parecer do Cliente *
              </label>
              <select
                value={customerFeedbackStatus}
                onChange={e => setCustomerFeedbackStatus(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="em_transito">🕒 Em Trânsito / Aguardando Parecer</option>
                <option value="aceito_sem_ressalvas">✅ Aceito sem Ressalvas (Aprovado)</option>
                <option value="aceito_com_observacao">⚠️ Aceito com Observação / Ressalva</option>
                <option value="reclamado_posteriormente">🚨 Reclamado Posteriormente (Gerou SAC)</option>
              </select>
            </div>
          </div>

          {/* Technical Notes / Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parecer Técnico / Justificativa da Liberação *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Descreva a justificativa técnica para liberação sob concessão..."
              value={technicalNotes}
              onChange={e => setTechnicalNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none text-xs"
            />
          </div>

          {/* Approved By */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Responsável pela Liberação
            </label>
            <input
              type="text"
              value={approvedBy}
              onChange={e => setApprovedBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/50 text-xs"
            />
          </div>

          {/* Photo Evidence Component */}
          <PhotoUploadCamera
            photos={photos}
            onPhotosChange={setPhotos}
            label="Evidências Fotográficas do Lote / Fardos"
            folder="concessoes"
          />

          {/* Dynamic Risk Card & Value Calculator */}
          {numQuantity > 0 && selectedDefect && selectedCustomer && severity && (
            <div className={`p-4 rounded-xl border space-y-3 transition-all ${
              riskResult?.riskLevel === 'baixo' ? 'bg-emerald-950/20 border-emerald-500/30' :
              riskResult?.riskLevel === 'moderado' ? 'bg-amber-950/20 border-amber-500/30' :
              riskResult?.riskLevel === 'alto' ? 'bg-orange-950/20 border-orange-500/30' :
              'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                    Avaliação Preditiva de Risco
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase font-mono ${
                  riskResult?.riskLevel === 'baixo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  riskResult?.riskLevel === 'moderado' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  riskResult?.riskLevel === 'alto' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                }`}>
                  Risco {riskResult?.riskLevel} ({riskResult?.score}/100)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/60 text-xs font-mono">
                <div className="flex items-center gap-2 text-teal-300">
                  <Scale className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>
                    Peso: <strong>{weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Scrap Salvo: <strong>R$ {estimatedSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!customerId || !defectTypeId || !opNumber.trim() || bales.length === 0 || !productName || !severity || !date || numQuantity <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>

        </form>
      </div>

      {/* Auxiliary Modals */}
      {isCustomerModalOpen && (
        <NewCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
        />
      )}

      {isDefectModalOpen && (
        <NewDefectModal
          isOpen={isDefectModalOpen}
          onClose={() => setIsDefectModalOpen(false)}
          initialName={defectModalInitialName}
        />
      )}
    </div>
  );
};
