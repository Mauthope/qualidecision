'use client';

import React, { useState, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import { DefectCategory } from '@/types';
import {
  Layers,
  Plus,
  Search,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DefectManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { defects, addDefect } = useQuality();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DefectCategory | 'todas'>('todas');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Defect Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DefectCategory>('visual');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');

  const filteredDefects = useMemo(() => {
    return defects.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'todas' || d.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [defects, search, selectedCategory]);

  if (!isOpen) return null;

  const handleCreateDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addDefect({
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      color
    });

    // Reset and close form
    setName('');
    setDescription('');
    setIsAddingNew(false);
  };

  const categories: Array<{ id: DefectCategory | 'todas'; label: string }> = [
    { id: 'todas', label: 'Todas as Categorias' },
    { id: 'costura', label: 'Costura & Fechamento' },
    { id: 'estrutural', label: 'Estrutural & Tecido' },
    { id: 'impressao', label: 'Impressão & Arte' },
    { id: 'dimensional', label: 'Dimensional & Corte' },
    { id: 'visual', label: 'Visual & Limpeza' }
  ];

  const presetColors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899'  // Pink
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-heading">
                  Gestão do Catálogo de Defeitos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {defects.length} Defeitos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consulte, gerencie e cadastre novos tipos de desvios industriais e não-conformidades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAddingNew
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
              }`}
            >
              {isAddingNew ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAddingNew ? 'Fechar Cadastro' : 'Novo Defeito'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm">
          
          {/* Add New Defect Form Card (Collapsible) */}
          {isAddingNew && (
            <form onSubmit={handleCreateDefect} className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Cadastrar Novo Tipo de Defeito
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome do Defeito / Não-Conformidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ex: Fio Puxado na Costura, Vinco Diagonal..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoria Técnica *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as DefectCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="costura">Costura & Fechamento</option>
                    <option value="estrutural">Estrutural & Tecido</option>
                    <option value="impressao">Impressão & Arte</option>
                    <option value="dimensional">Dimensional & Corte</option>
                    <option value="visual">Visual & Limpeza</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição Técnica do Defeito
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explique as características técnicas e impacto no produto..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor de Identificação Visual
                </label>
                <div className="flex items-center gap-2">
                  {presetColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer ml-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Salvar Defeito no Catálogo
                </button>
              </div>
            </form>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar defeito por nome ou descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Defects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDefects.map(defect => (
              <div
                key={defect.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: defect.color }} />
                      <span className="font-bold text-slate-100 text-xs">{defect.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      {defect.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {defect.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>ID: {defect.id}</span>
                  <span className="text-emerald-400 font-bold">Ativo no Catálogo</span>
                </div>
              </div>
            ))}
          </div>

          {filteredDefects.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Nenhum defeito encontrado</p>
              <p className="text-xs text-slate-500">Tente buscar por outro termo ou limpe os filtros de categoria.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};