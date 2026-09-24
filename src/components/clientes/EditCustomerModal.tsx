'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { useQuality } from '@/context/QualityContext';
import { Building2, X, Hash, MapPin, Tag, Check, Pencil, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const EditCustomerModal: React.FC<Props> = ({ isOpen, onClose, customer }) => {
  const { updateCustomer } = useQuality();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [segment, setSegment] = useState('');
  const [location, setLocation] = useState('');
  const [initialProfile, setInitialProfile] = useState<'padrao' | 'exigente' | 'flexivel'>('padrao');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      setName(customer.name || '');
      setCode(customer.code || '');
      setSegment(customer.segment || '');
      setLocation(customer.location || customer.cityState || '');

      // Detecta perfil inicial aproximado de acordo com o score atual
      if (customer.overallToleranceScore !== undefined) {
        if (customer.overallToleranceScore <= 65) {
          setInitialProfile('exigente');
        } else if (customer.overallToleranceScore >= 85) {
          setInitialProfile('flexivel');
        } else {
          setInitialProfile('padrao');
        }
      } else {
        setInitialProfile('padrao');
      }
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      updateCustomer(customer.id, {
        name: name.trim(),
        code: code.trim(),
        segment: segment.trim() || undefined,
        location: location.trim() || undefined,
        cityState: location.trim() || undefined,
        initialProfile
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Editar Informações do Cliente
              </h3>
              <p className="text-xs text-slate-400">
                Atualize o código ERP, razão social, segmento e perfil de tolerância técnica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome da Empresa */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nome do Cliente / Razão Social *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Copacol - Cooperativa Agroindustrial"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Número do Cliente / Código ERP */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>Número do Cliente / Código no ERP *</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ex: CLI-001 ou 10425"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Identificador associado às OPs, envios e relatórios.
              </p>
            </div>

            {/* Segmento */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Segmento de Atuação</span>
              </label>
              <input
                type="text"
                value={segment}
                onChange={e => setSegment(e.target.value)}
                placeholder="Ex: Sacaria / Grãos, Frigorífico, Fertilizantes"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Localização / Cidade-UF */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Localização / Cidade - UF</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ex: Cafelândia/PR"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Perfil Inicial de Tolerância Técnica (Sem Histórico Prévio no ERP) */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <label className="block text-xs font-bold text-slate-200">
                Perfil Inicial de Tolerância Técnica (Sem Histórico Prévio no ERP)
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Escolha ou redefina a base técnica de tolerância para o cálculo de risco de concessões deste cliente:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              {/* Opção 1: Padrão */}
              <div
                onClick={() => setInitialProfile('padrao')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialProfile === 'padrao'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs">Padrão de Mercado</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    80%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Tolerância moderada a alta. Aceita desvios estéticos e leves sem restrições.
                </p>
              </div>

              {/* Opção 2: Exigente */}
              <div
                onClick={() => setInitialProfile('exigente')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialProfile === 'exigente'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-200 ring-1 ring-rose-500/50 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs">Rígido / Exigente</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    50%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Alimentício/Exportação. Restrição severa a costura, solda e desvios dimensionais.
                </p>
              </div>

              {/* Opção 3: Flexível */}
              <div
                onClick={() => setInitialProfile('flexivel')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialProfile === 'flexivel'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs">Alta Flexibilidade</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    90%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Processo flexível. Alta aceitação de lotes com pequenas concessões operacionais.
                </p>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !code.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
