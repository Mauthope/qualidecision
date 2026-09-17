'use client';

import React, { useState, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import { DefectSeverity } from '@/types';
import { Send, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, X, Sparkles, DollarSign, UserPlus } from 'lucide-react';
import { NewCustomerModal } from '@/components/clientes/NewCustomerModal';
import { PhotoUploadCamera } from '@/components/common/PhotoUploadCamera';
import { SearchableCustomerSelect } from '@/components/common/SearchableCustomerSelect';
import { SearchableDefectSelect } from '@/components/common/SearchableDefectSelect';
import { BaleListInput } from '@/components/common/BaleListInput';
import { ComplaintPhoto } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  initialData?: {
    customerId?: string;
    defectTypeId?: string;
    quantity?: number;
    severity?: DefectSeverity;
  } | null;
}

export const NewConcessionModal: React.FC<Props> = ({ isOpen, onClose, defaultCustomerId, initialData }) => {
  const { customers, defects, addConcession, evaluateRisk, settings } = useQuality();

  const [customerId, setCustomerId] = useState(initialData?.customerId || defaultCustomerId || '');
  const [customerNumber, setCustomerNumber] = useState('');
  const [date, setDate] = useState('');
  const [opNumber, setOpNumber] = useState('');
  const [defectTypeId, setDefectTypeId] = useState(initialData?.defectTypeId || '');
  const [bales, setBales] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(initialData?.quantity !== undefined ? initialData.quantity : '');
  const [severity, setSeverity] = useState<DefectSeverity | ''>(initialData?.severity || '');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState('Mauricio Grigol (Qualidade)');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [photos, setPhotos] = useState<ComplaintPhoto[]>([]);

  // Limpa os campos ao abrir o modal ou aplica initialData se fornecido pela simulação da IA
  React.useEffect(() => {
    if (isOpen) {
      setCustomerId(initialData?.customerId || defaultCustomerId || '');
      setCustomerNumber('');
      setDate('');
      setOpNumber('');
      setDefectTypeId(initialData?.defectTypeId || '');
      setBales([]);
      setProductName('');
      setQuantity(initialData?.quantity !== undefined ? initialData.quantity : '');
      setSeverity(initialData?.severity || '');
      setTechnicalNotes('');
      setPhotos([]);
    }
  }, [isOpen, defaultCustomerId, initialData]);

  // Selected entities
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !defectTypeId || !opNumber.trim() || bales.length === 0 || !productName || !severity || !date || numQuantity <= 0) {
      return;
    }

    addConcession({
      customerId,
      customerNumber: customerNumber.trim() || selectedCustomer?.code,
      opNumber: opNumber.trim(),
      date,
      bales,
      productName: productName.trim(),
      defectTypeId,
      quantity: numQuantity,
      severity,
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
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">Novo Envio com Desvio / Concessão</h3>
              <p className="text-xs text-slate-400">Avaliação prévia de risco e registro de scrap evitado</p>
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
            {/* Customer with Search Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Cliente Destinatário *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
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

            {/* Defect Type with Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Desvio / Defeito *
              </label>
              <SearchableDefectSelect
                defects={defects}
                selectedDefectId={defectTypeId}
                onSelectDefect={setDefectTypeId}
                placeholder="Selecione o defeito / desvio..."
                required
              />
            </div>
          </div>

          {/* Identificadores: Data do Envio, Número Cliente, Número OP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Data do Envio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Data do Envio *
                </label>
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split('T')[0])}
                  className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  [Hoje]
                </button>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 [color-scheme:dark]"
              />
            </div>

            {/* Customer Number / Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número do Cliente
              </label>
              <input
                type="text"
                value={customerNumber}
                onChange={e => setCustomerNumber(e.target.value)}
                placeholder={selectedCustomer?.code ? `Ex: ${selectedCustomer.code}` : "Informe o código..."}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            {/* OP Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número da OP *
              </label>
              <input
                type="text"
                required
                value={opNumber}
                onChange={e => setOpNumber(e.target.value)}
                placeholder="Informe a OP..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>
          </div>

          {/* Fardos Individuais (Adição dinâmica por botão) */}
          <BaleListInput
            bales={bales}
            onChange={setBales}
            variant="cyan"
            required={true}
            label="Número do(s) Fardo(s) com Desvio *"
            helperText="Adicione cada número de fardo com o botão '+ Add Fardo' (ou intervalos como 101-105 / cole do Excel)."
          />

          {/* Produto, Quantidade e Gravidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Product / Packaging Identification Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Identificação do Produto / Embalagem *
              </label>
              <select
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-medium"
                required
              >
                <option value="">Selecione (Sacaria, Big Bag)...</option>
                <option value="Sacaria">Sacaria</option>
                <option value="Big Bag">Big Bag</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantidade (unidades) *
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={e => setQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                placeholder="Informe a quantidade..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono"
                required
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gravidade do Desvio *
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as DefectSeverity)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                required
              >
                <option value="">Selecione a gravidade...</option>
                <option value="leve">Leve (Apenas estético superficial)</option>
                <option value="moderada">Moderada (Perceptível)</option>
                <option value="severa">Severa (Risco dimensional/funcional)</option>
              </select>
            </div>
          </div>

          {/* Live Risk & Tolerance Insight Card */}
          {riskResult && selectedCustomer && selectedDefect && (
            <div className={`p-4 rounded-xl border transition-all ${
              riskResult.riskLevel === 'baixo'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : riskResult.riskLevel === 'moderado'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-black/30 shrink-0 mt-0.5">
                  {riskResult.riskLevel === 'baixo' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : riskResult.riskLevel === 'moderado' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm">
                      {riskResult.title}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/40 border border-current font-semibold">
                      Risco: {riskResult.score}/100
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {riskResult.summary}
                  </p>
                  <div className="pt-1.5 text-[11px] opacity-95 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Orientação da IA:</strong> {riskResult.recommendation}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profitability Calculation Preview */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Refugo Evitado (Lucro Estimado Salvo):
                </div>
                <div className="text-[11px] text-slate-400">
                  {numQuantity > 0 ? numQuantity.toLocaleString('pt-BR') : 0} un × {settings.sackWeightGrams.toLocaleString('pt-BR')}g = <strong className="text-cyan-300 font-mono">{weightKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</strong> (R$ {settings.costPerKg.toFixed(2)}/kg)
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-extrabold text-base text-cyan-300">
                {numQuantity > 0 ? `R$ ${estimatedSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
              </span>
            </div>
          </div>

          {/* Direct Camera / File Upload for Concession Evidence */}
          <PhotoUploadCamera
            photos={photos}
            onPhotosChange={setPhotos}
            label="Evidências Fotográficas do Desvio Concedido"
            maxPhotos={6}
          />

          {/* Technical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parecer Técnico / Observações da Liberação
            </label>
            <textarea
              rows={2}
              value={technicalNotes}
              onChange={e => setTechnicalNotes(e.target.value)}
              placeholder="Descreva o motivo da concessão e detalhes do acordo..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Responsible */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Responsável pela Liberação
            </label>
            <input
              type="text"
              value={approvedBy}
              onChange={e => setApprovedBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
            />
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
              disabled={!customerId || !defectTypeId || !opNumber.trim() || bales.length === 0 || !productName || !severity || !date || numQuantity <= 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Confirmar Envio com Concessão
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
    </div>
  );
};
