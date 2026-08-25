'use client';

import React, { useState } from 'react';
import { useQuality } from '@/context/QualityContext';
import { Customer } from '@/types';
import {
  Users,
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCustomer: Customer) => void;
}

export const NewCustomerModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { customers, addCustomer } = useQuality();

  const [name, setName] = useState('');
  const [code, setCode] = useState(`CLI-${String(customers.length + 1).padStart(3, '0')}`);
  const [location, setLocation] = useState('');
  const [segment, setSegment] = useState('Agroindústria / Grãos & Cereais');
  const [initialProfile, setInitialProfile] = useState<'padrao' | 'exigente' | 'flexivel'>('padrao');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = addCustomer({
      name: name.trim(),
      code: code.trim(),
      segment: segment.trim(),
      location: location.trim() || undefined,
      initialProfile
    });

    if (onSuccess) {
      onSuccess(created);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Cadastrar Novo Cliente para Envio / Concessão
              </h3>
              <p className="text-xs text-slate-400">
                Cadastre o cliente e defina o perfil inicial de tolerância técnica
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Razão Social / Nome da Empresa *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Cooperativa Agroindustrial Nova Aurora"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Código do Cliente (ERP / Interno)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Localidade (Cidade/UF)
              </label>
              <input
                type="text"
                placeholder="Ex: Chapecó/SC, Curitiba/PR..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Segmento de Atuação
              </label>
              <select
                value={segment}
                onChange={e => setSegment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Agroindústria / Grãos & Cereais">Agroindústria / Grãos & Cereais</option>
                <option value="Frigoríficos & Proteína Animal">Frigoríficos & Proteína Animal</option>
                <option value="Rações & Nutrição Animal">Rações & Nutrição Animal</option>
                <option value="Fertilizantes & Químicos">Fertilizantes & Químicos</option>
                <option value="Mineração, Cimento & Construção">Mineração, Cimento & Construção</option>
                <option value="Indústria Alimentícia / Farináceos">Indústria Alimentícia / Farináceos</option>
                <option value="Exportação / Outros">Exportação / Outros</option>
              </select>
            </div>
          </div>

          {/* Initial Tolerance Profile Selection */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              Perfil Inicial de Tolerância Técnica (Sem Histórico Prévio no ERP)
            </label>
            <p className="text-[11px] text-slate-400">
              Como este cliente é novo, escolha a base técnica inicial para o cálculo de risco de concessões:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              {/* Option 1: Padrão */}
              <div
                onClick={() => setInitialProfile('padrao')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialProfile === 'padrao'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
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

              {/* Option 2: Exigente */}
              <div
                onClick={() => setInitialProfile('exigente')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialProfile === 'exigente'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
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

              {/* Option 3: Flexível */}
              <div
                onClick={() => setInitialProfile('flexivel')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialProfile === 'flexivel'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
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

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar e Habilitar Cliente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
