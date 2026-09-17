'use client';

import React, { useState } from 'react';
import { Plus, X, Package, Layers } from 'lucide-react';

interface Props {
  bales: string[];
  onChange: (bales: string[]) => void;
  variant?: 'cyan' | 'rose';
  label?: string;
  helperText?: string;
}

export const BaleListInput: React.FC<Props> = ({
  bales,
  onChange,
  variant = 'cyan',
  label = 'Fardo(s) Envolvido(s)',
  helperText = 'Adicione cada número de fardo individualmente ou em lote'
}) => {
  const [inputValue, setInputValue] = useState('');

  const isCyan = variant === 'cyan';

  const parseBaleInput = (text: string): string[] => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Suporte para colagem ou separação por vírgula, ponto-e-vírgula, espaço ou quebra de linha
    const parts = trimmed.split(/[\n,;\t]+/).map(p => p.trim()).filter(Boolean);
    const result: string[] = [];

    for (const part of parts) {
      // Suporte para intervalos numéricos simples como "101-105" ou "101 a 105"
      const rangeMatch = part.match(/^(\d+)\s*(?:-|a|até)\s*(\d+)$/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 100) {
          for (let i = start; i <= end; i++) {
            result.push(String(i));
          }
          continue;
        }
      }
      result.push(part);
    }

    return result;
  };

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newItems = parseBaleInput(inputValue);
    if (newItems.length === 0) return;

    // Evita duplicatas mantendo a ordem
    const combined = [...bales];
    for (const item of newItems) {
      if (!combined.includes(item)) {
        combined.push(item);
      }
    }

    onChange(combined);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(bales.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2 rounded-xl bg-slate-900/50 p-3 border border-slate-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Package className={`w-3.5 h-3.5 ${isCyan ? 'text-cyan-400' : 'text-rose-400'}`} />
          <label className="block text-xs font-semibold text-slate-300">
            {label}
          </label>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {bales.length > 0 ? (
            <span className={`font-semibold ${isCyan ? 'text-cyan-400' : 'text-rose-400'}`}>
              {bales.length} fardo{bales.length > 1 ? 's' : ''} registrado{bales.length > 1 ? 's' : ''}
            </span>
          ) : (
            'Opcional'
          )}
        </span>
      </div>

      {/* Input com botão integrado de Adicionar Fardo */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nº do fardo (ex: 104, ou intervalo 101-105)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            isCyan
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 active:scale-95'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 active:scale-95'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Fardo</span>
        </button>
      </div>

      {/* Lista de Fardos Adicionados */}
      {bales.length > 0 ? (
        <div className="pt-1.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-500" />
              Lista de fardos adicionados:
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors underline cursor-pointer"
            >
              Limpar todos
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1 rounded-lg bg-slate-950/60 border border-slate-900">
            {bales.map((bale, idx) => (
              <span
                key={`${bale}-${idx}`}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-medium border animate-in fade-in zoom-in-95 duration-100 ${
                  isCyan
                    ? 'bg-cyan-950/50 border-cyan-800/60 text-cyan-200'
                    : 'bg-rose-950/50 border-rose-800/60 text-rose-200'
                }`}
              >
                <span className="text-[10px] opacity-70">#</span>
                <span>{bale}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Remover fardo"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
