'use client';

import React, { useState } from 'react';
import { Customer, DefectType, Complaint, ToleranceLevel } from '@/types';
import { useQuality } from '@/context/QualityContext';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Edit3,
  Save,
  Info,
  Filter,
  Layers,
  Search
} from 'lucide-react';

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

  // Default to showing only claimed defects as requested
  const [viewMode, setViewMode] = useState<'only_claimed' | 'all'>('only_claimed');
  const [defectSearch, setDefectSearch] = useState('');

  // List of defects that this customer actually complained about in ERP
  const claimedDefectIds = new Set(
    complaints
      .filter(c => c.customerId === customer.id)
      .map(c => c.defectTypeId)
  );

  const displayedDefects = defects.filter(defect => {
    const isClaimed = claimedDefectIds.has(defect.id);
    const matchesSearch = defect.name.toLowerCase().includes(defectSearch.toLowerCase()) ||
      defect.category.toLowerCase().includes(defectSearch.toLowerCase());

    if (viewMode === 'only_claimed') {
      return isClaimed && matchesSearch;
    }
    return matchesSearch;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Matriz de Tolerância por Tipo de Defeito
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {claimedDefectIds.size} Reclamados
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Diretrizes de tolerância e histórico de ocorrências registradas no ERP
            </p>
          </div>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode('only_claimed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'only_claimed'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apenas Reclamados ({claimedDefectIds.size})</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos os 69 Defeitos</span>
          </button>
        </div>
      </div>

      {/* Search Bar when viewing all */}
      {viewMode === 'all' && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por nome do defeito ou categoria..."
            value={defectSearch}
            onChange={e => setDefectSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      )}

      {/* Grid of Defects */}
      {displayedDefects.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {viewMode === 'only_claimed'
                ? 'Nenhum defeito reclamado no histórico deste cliente!'
                : 'Nenhum defeito encontrado para a busca.'}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {viewMode === 'only_claimed'
                ? 'Este cliente não possui registros de não-conformidades no banco do ERP. Todas as regras de tolerância seguem a parametrização inicial padrão.'
                : 'Tente buscar por outro termo.'}
            </p>
          </div>
          {viewMode === 'only_claimed' && (
            <button
              onClick={() => setViewMode('all')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ver Todos os 69 Defeitos do Catálogo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedDefects.map(defect => {
            const rating = customer.toleranceRatings?.[defect.id];
            const level: ToleranceLevel = rating?.level || 'moderada';
            const notes = rating?.notes || 'Sem observações técnicas específicas cadastradas.';
            const defectComplaints = complaints.filter(
              c => c.customerId === customer.id && c.defectTypeId === defect.id
            );

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
                        className="text-slate-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
      )}
    </div>
  );
};
