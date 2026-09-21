'use client';

import React, { useState, useEffect } from 'react';
import { useQuality } from '@/context/QualityContext';
import { DefectType, DefectCategory } from '@/types';
import {
  AlertTriangle,
  X,
  Tag,
  CheckCircle2,
  Sparkles,
  DollarSign,
  FileText,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newDefect: DefectType) => void;
  initialName?: string;
}

const CATEGORY_CONFIG: Record<DefectCategory, { label: string; color: string; description: string }> = {
  costura: {
    label: 'Costura & Fechamento',
    color: '#ef4444',
    description: 'Falhas de ponto, descostura, linha rompida, falta de arremate'
  },
  solda: {
    label: 'Solda & Válvula',
    color: '#10b981',
    description: 'Descolamento térmico, solda fraca, furos na válvula ou fundo'
  },
  impressao: {
    label: 'Impressão & Arte',
    color: '#f59e0b',
    description: 'Desalinhamento de clichê, manchas de tinta, tonalidade fora do padrão'
  },
  dimensional: {
    label: 'Dimensional & Corte',
    color: '#8b5cf6',
    description: 'Largura, comprimento, folga de corte, gramatura ou sanfona fora da tolerância'
  },
  estrutural: {
    label: 'Estrutural & Tecido',
    color: '#f97316',
    description: 'Fitas rompidas, resistência mecânica abaixo da norma, delaminação'
  },
  visual: {
    label: 'Visual & Limpeza',
    color: '#06b6d4',
    description: 'Poeira, marcas superficiais, manchas estéticas sem impacto mecânico'
  },
  outro: {
    label: 'Outros / Operacional',
    color: '#64748b',
    description: 'Identificações atípicas ou desvios em triagem técnica'
  }
};

const PRESET_COLORS = [
  '#ef4444', // Vermelho
  '#f97316', // Laranja
  '#f59e0b', // Âmbar
  '#10b981', // Verde esmeralda
  '#06b6d4', // Ciano
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#64748b'  // Ardósia
];

function suggestCategory(text: string): DefectCategory {
  const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/costur|fio|bainha|ponto|linha|fechamento|agulha|rebentar/.test(norm)) return 'costura';
  if (/sold|valvula|fundo|termossold|selagem/.test(norm)) return 'solda';
  if (/impr|tinta|arte|tonalidad|logo|cliche|mancha de tinta|borr/.test(norm)) return 'impressao';
  if (/medid|largur|comprimento|corte|gramatur|espessura|milimetro|cm|sanfona/.test(norm)) return 'dimensional';
  if (/rasg|furo|resistencia|trama|fita|desfi|laminacao|carga|tracao/.test(norm)) return 'estrutural';
  if (/manch|suj|poeira|oleo|graxa|aspecto|brilho|corpo estranho/.test(norm)) return 'visual';
  return 'visual';
}

export const NewDefectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = ''
}) => {
  const { addDefect } = useQuality();

  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<DefectCategory>('visual');
  const [description, setDescription] = useState('');
  const [defaultUnitLoss, setDefaultUnitLoss] = useState<number | string>(15.00);
  const [color, setColor] = useState('#06b6d4');

  // Atualiza estado quando o modal abre ou initialName muda
  useEffect(() => {
    if (isOpen) {
      const trimmedInitial = initialName.trim();
      setName(trimmedInitial);
      const suggested = trimmedInitial ? suggestCategory(trimmedInitial) : 'visual';
      setCategory(suggested);
      setColor(CATEGORY_CONFIG[suggested].color);
      setDescription('');
      setDefaultUnitLoss(15.00);
    }
  }, [isOpen, initialName]);

  // Sincroniza cor quando muda categoria (a menos que já tenha escolhido outra)
  const handleCategoryChange = (cat: DefectCategory) => {
    setCategory(cat);
    setColor(CATEGORY_CONFIG[cat].color);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const unitLoss = typeof defaultUnitLoss === 'number'
      ? defaultUnitLoss
      : parseFloat(defaultUnitLoss) || 15.00;

    const created = addDefect({
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      color,
      defaultUnitLoss: unitLoss
    });

    if (onSuccess) {
      onSuccess(created);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color: color
              }}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-heading">
                  Cadastrar Novo Defeito / Desvio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                  Catálogo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cadastre o desvio técnico para usar em concessões e monitoramento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
          
          {/* Nome do Defeito */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Nome do Defeito / Desvio *
              </label>
              {initialName && name === initialName && (
                <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Preenchido da busca
                </span>
              )}
            </div>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Falha de costura superior, Impressão fora de centro..."
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  // Se ainda não escolheu categoria manualmente, sugere conforme digita
                  if (!initialName && e.target.value.length >= 3) {
                    const sug = suggestCategory(e.target.value);
                    setCategory(sug);
                    setColor(CATEGORY_CONFIG[sug].color);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoria Técnica *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as DefectCategory[]).map(catKey => {
                const conf = CATEGORY_CONFIG[catKey];
                const isSelected = category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleCategoryChange(catKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/40 text-white'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: conf.color }}
                      />
                      <span className="text-xs font-semibold truncate">
                        {conf.label.split('&')[0].trim()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1 leading-tight">
                      {conf.label.includes('&') ? conf.label.split('&')[1].trim() : conf.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição Técnica */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Descrição Técnica / Critério de Aceite</span>
              <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tolerância de até 15mm de desalinhamento na boca. Não aplicar para clientes de rações com embalagem automática..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Linha dupla: Perda Unitária Padrão + Cor de Identificação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Custo/Perda unitária padrão */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Perda Estimada Unitária (R$)</span>
                <span className="text-[10px] text-slate-500 font-normal">Scrap evitado</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultUnitLoss}
                  onChange={e => setDefaultUnitLoss(e.target.value)}
                  placeholder="15.00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Usado para estimar o valor financeiro recuperado em concessões.
              </p>
            </div>

            {/* Cor de Identificação */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cor de Destaque no Gráfico
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-lg transition-transform ${
                      color === c
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                Destaque visual nos gráficos e listas
              </p>
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
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar e Selecionar Defeito</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
