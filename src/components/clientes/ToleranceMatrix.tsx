'use client';

import React, { useState } from 'react';
import { Customer, DefectType, Complaint, ToleranceLevel } from '@/types';
import { useQuality } from '@/context/QualityContext';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Edit3, Save, Info } from 'lucide-react';

interface Props {
  customer: Customer;
  defects: DefectType[];
  complaints: Complaint[];
}

export const ToleranceMatrix: React.FC<Props> = ({ customer, defects, complaints }) => {
  const { updateCustomerTolerance } = useQuality();
  const [editingDefectId, setEditingDefectId] = useState<string | null>(null);
  const [tempLevel, setTempLevel] = useState<ToleranceLevel>('moderada');
  const [tempNotes, setTempNotes] = useState<string>('');

  const handleStartEdit = (defectId: string) => {
    const currentRating = customer.toleranceRatings?.[defectId];
    setEditingDefectId(defectId);
    setTempLevel(currentRating?.level || 'moderada');
    setTempNotes(currentRating?.notes || '');
  };

  const handleSaveEdit = (defectId: string) => {
    updateCustomerTolerance(customer.id, defectId, tempLevel, tempNotes);
    setEditingDefectId(null);
  };

  return (
    <div className="glow-card p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading">
              Matriz de Tolerância por Tipo de Defeito
            </h3>
            <p className="text-xs text-slate-400">
              Regras e diretrizes técnicas para aprovação de concessões de desvio
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Defects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {defects.map(defect => {
          const rating = customer.toleranceRatings?.[defect.id];
          const level: ToleranceLevel = rating?.level || 'moderada';
          const notes = rating?.notes || 'Sem observações técnicas específicas cadastradas.';
          const defectComplaints = complaints.filter(c => c.customerId === customer.id && c.defectTypeId === defect.id);

          const isEditing = editingDefectId === defect.id;

          let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          let levelIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
          let levelLabel = 'Alta Tolerância';

          if (level === 'intolerante') {
            badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            levelIcon = <XCircle className="w-4 h-4 text-rose-400" />;
            levelLabel = 'Zero Tolerância / Intolerante';
          } else if (level === 'baixa') {
            badgeColor = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
            levelIcon = <AlertTriangle className="w-4 h-4 text-orange-400" />;
            levelLabel = 'Baixa Tolerância';
          } else if (level === 'moderada') {
            badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            levelIcon = <Info className="w-4 h-4 text-amber-400" />;
            levelLabel = 'Tolerância Moderada';
          }

          return (
            <div
              key={defect.id}
              className={`p-4 rounded-xl border transition-all ${
                isEditing
                  ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              } flex flex-col justify-between space-y-3`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: defect.color }} />
                  <div>
                    <span className="font-bold text-slate-100 text-xs sm:text-sm">{defect.name}</span>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{defect.category}</div>
                  </div>
                </div>

                {!isEditing && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
                    {levelIcon}
                    <span>{levelLabel}</span>
                  </span>
                )}
              </div>

              {/* Edit Mode vs Display Mode */}
              {isEditing ? (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nível de Tolerância:
                    </label>
                    <select
                      value={tempLevel}
                      onChange={e => setTempLevel(e.target.value as ToleranceLevel)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="alta">Alta Tolerância (Aceita sem restrições)</option>
                      <option value="moderada">Tolerância Moderada (Aceita com ressalvas/leve)</option>
                      <option value="baixa">Baixa Tolerância (Risco elevado de devolução)</option>
                      <option value="intolerante">Zero Tolerância (Rejeição imediata)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parecer e Diretriz Técnica:
                    </label>
                    <textarea
                      rows={2}
                      value={tempNotes}
                      onChange={e => setTempNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingDefectId(null)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(defect.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                    {notes}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {(() => {
                      const defectKg = defectComplaints.reduce((sum, c) => sum + (c.quantityAffected || 0), 0);
                      return (
                        <span className={`font-medium ${defectComplaints.length > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                          {defectComplaints.length > 0
                            ? `⚠️ ${defectComplaints.length} registro(s) no ERP (${defectKg > 0 ? `${defectKg.toLocaleString('pt-BR')} kg` : 'desvio pontual'})`
                            : 'Nenhuma ocorrência registrada'}
                        </span>
                      );
                    })()}

                    <button
                      onClick={() => handleStartEdit(defect.id)}
                      className="text-slate-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      Editar Regra
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
