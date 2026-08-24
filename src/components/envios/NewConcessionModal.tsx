'use client';

import React, { useState, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import { DefectSeverity } from '@/types';
import { Send, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, X, Sparkles, DollarSign, UserPlus } from 'lucide-react';
import { NewCustomerModal } from '@/components/clientes/NewCustomerModal';
import { PhotoUploadCamera } from '@/components/common/PhotoUploadCamera';
import { ComplaintPhoto } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
}

export const NewConcessionModal: React.FC<Props> = ({ isOpen, onClose, defaultCustomerId }) => {
  const { customers, defects, addConcession, evaluateRisk } = useQuality();

  const [customerId, setCustomerId] = useState(defaultCustomerId || (customers[0]?.id || ''));
  const [defectTypeId, setDefectTypeId] = useState(defects[0]?.id || '');
  const [lotNumber, setLotNumber] = useState(`LT-2026-${Math.floor(800 + Math.random() * 199)}`);
  const [productName, setProductName] = useState('Sacaria Ráfia Laminada 25kg');
  const [quantity, setQuantity] = useState<number>(5000);
  const [severity, setSeverity] = useState<DefectSeverity>('leve');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState('Mauricio Grigol (Qualidade)');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [photos, setPhotos] = useState<ComplaintPhoto[]>([]);

  // Selected entities
  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedDefect = defects.find(d => d.id === defectTypeId);

  // Live Risk Assessment
  const riskResult = useMemo(() => {
    if (!customerId || !defectTypeId) return null;
    return evaluateRisk(customerId, defectTypeId, quantity, severity);
  }, [customerId, defectTypeId, quantity, severity, evaluateRisk]);

  const unitLoss = selectedDefect?.defaultUnitLoss || 15.00;
  const estimatedSavedValue = quantity * unitLoss;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !defectTypeId || quantity <= 0) return;

    addConcession({
      customerId,
      lotNumber: lotNumber.trim(),
      productName: productName.trim(),
      defectTypeId,
      quantity,
      severity,
      unitSavedValue: unitLoss,
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
            {/* Customer */}
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
                  <span>+ Novo Cliente</span>
                </button>
              </div>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                required
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - Score: {c.overallToleranceScore}%
                  </option>
                ))}
              </select>
            </div>

            {/* Defect Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Desvio / Defeito *
              </label>
              <select
                value={defectTypeId}
                onChange={e => setDefectTypeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                required
              >
                {defects.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.category.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lot Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número do Lote *
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={e => setLotNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantidade (unidades) *
              </label>
              <input
                type="number"
                min={1}
                step={100}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
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
              >
                <option value="leve">Leve (Apenas estético superficial)</option>
                <option value="moderada">Moderada (Perceptível)</option>
                <option value="severa">Severa (Risco dimensional/funcional)</option>
              </select>
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Identificação do Produto / Embalagem
            </label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="ex: Sacaria Ráfia 25kg, Big Bag Tubular 1000kg..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
            />
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
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Refugo Evitado (Lucro Salvo):</div>
                <div className="text-[11px] text-slate-400">R$ {unitLoss.toFixed(2)} por unidade reaproveitada</div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-extrabold text-base text-cyan-300">
                R$ {estimatedSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
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
