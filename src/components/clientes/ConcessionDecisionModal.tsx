'use client';

import React, { useState, useMemo } from 'react';
import { Customer, DefectSeverity } from '@/types';
import { useQuality } from '@/context/QualityContext';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Send,
  ShieldCheck,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';

interface Props {
  isOpen: boolean;
  customer: Customer;
  onClose: () => void;
}

export const ConcessionDecisionModal: React.FC<Props> = ({ isOpen, customer, onClose }) => {
  const { defects, complaints, concessions, evaluateRisk } = useQuality();

  const [defectTypeId, setDefectTypeId] = useState(defects[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(5000);
  const [severity, setSeverity] = useState<DefectSeverity>('leve');
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);

  const selectedDefect = defects.find(d => d.id === defectTypeId);

  const riskResult = useMemo(() => {
    if (!customer || !defectTypeId) return null;
    return evaluateRisk(customer.id, defectTypeId, quantity, severity);
  }, [customer, defectTypeId, quantity, severity, evaluateRisk]);

  const relatedComplaints = complaints.filter(
    c => c.customerId === customer.id && c.defectTypeId === defectTypeId
  );

  const relatedConcessions = concessions.filter(
    c => c.customerId === customer.id && c.defectTypeId === defectTypeId
  );

  if (!isOpen) return null;

  const unitSaved = selectedDefect?.defaultUnitLoss || 15.00;
  const totalSaved = quantity * unitSaved;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Simulador de Decisão de Envio com Desvio
                </h3>
                <p className="text-xs text-slate-400">
                  Avalie o risco antes de liberar o lote para <strong>{customer.name}</strong>
                </p>
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
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-sm">
            
            {/* Input parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Defeito a Enviar
                </label>
                <select
                  value={defectTypeId}
                  onChange={e => setDefectTypeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                >
                  {defects.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quantidade do Lote (un)
                </label>
                <input
                  type="number"
                  min={1}
                  step={500}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Severidade do Defeito
                </label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as DefectSeverity)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="leve">Leve (Superficial/Estético)</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa (Risco Funcional)</option>
                </select>
              </div>
            </div>

            {/* Risk Card */}
            {riskResult && (
              <div className={`p-5 rounded-2xl border transition-all ${
                riskResult.riskLevel === 'baixo'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : riskResult.riskLevel === 'moderado'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {riskResult.riskLevel === 'baixo' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : riskResult.riskLevel === 'moderado' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                    <span className="font-extrabold text-sm sm:text-base font-heading">
                      {riskResult.title}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/40 border border-current">
                    Score de Risco: {riskResult.score}/100
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {riskResult.summary}
                </p>

                <div className="p-3 rounded-xl bg-black/30 border border-current/20 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recomendação Técnica da IA:
                  </div>
                  <p className="opacity-90">{riskResult.recommendation}</p>
                </div>
              </div>
            )}

            {/* Historical Cross-Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-300">Reclamações Passadas deste Defeito:</div>
                <div className="text-rose-400 font-bold font-mono text-sm">
                  {relatedComplaints.length} registro(s) {(() => {
                    const kg = relatedComplaints.reduce((sum, c) => sum + (c.quantityAffected || 0), 0);
                    return kg > 0 ? `(${kg.toLocaleString('pt-BR')} kg)` : '';
                  })()}
                </div>
                <p className="text-[11px] text-slate-400">
                  {relatedComplaints.length === 0
                    ? 'Cliente nunca reclamou formalmente deste tipo de defeito.'
                    : 'Atenção: Houve histórico registrado no ERP para este defeito.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-300">Concessões Anteriores Aceitas:</div>
                <div className="text-cyan-400 font-bold font-mono text-sm">
                  {relatedConcessions.length} lote(s)
                </div>
                <p className="text-[11px] text-slate-400">
                  {relatedConcessions.length > 0
                    ? 'Cliente já recebeu e aceitou lotes similares sem problemas.'
                    : 'Nenhum envio com este defeito registrado anteriormente.'}
                </p>
              </div>
            </div>

            {/* Financial Impact */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>Lucro Preservado / Refugo Evitado neste Lote:</span>
              </div>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Fechar
            </button>

            <button
              onClick={() => {
                onClose();
                setIsConcessionModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <span>Prosseguir para Registro de Envio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isConcessionModalOpen && (
        <NewConcessionModal
          isOpen={isConcessionModalOpen}
          defaultCustomerId={customer.id}
          onClose={() => setIsConcessionModalOpen(false)}
        />
      )}
    </>
  );
};
