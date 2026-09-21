'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DefectType } from '@/types';
import { Search, Check, ChevronDown, AlertCircle, X, PlusCircle } from 'lucide-react';

interface Props {
  defects: DefectType[];
  selectedDefectId: string;
  onSelectDefect: (defectId: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onCreateNew?: (initialName?: string) => void;
}

export const SearchableDefectSelect: React.FC<Props> = ({
  defects,
  selectedDefectId,
  onSelectDefect,
  placeholder = 'Pesquisar defeito / desvio...',
  required = false,
  className = '',
  onCreateNew
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedDefect = defects.find(d => d.id === selectedDefectId);

  // Filter defects by name, category or description
  const filteredDefects = defects.filter(d => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      d.name.toLowerCase().includes(term) ||
      d.category.toLowerCase().includes(term) ||
      (d.description && d.description.toLowerCase().includes(term))
    );
  });

  const hasExactMatch = searchTerm.trim()
    ? defects.some(d => d.name.toLowerCase() === searchTerm.trim().toLowerCase())
    : true;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={selectedDefectId}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-left text-slate-100 flex items-center justify-between gap-2 focus:outline-none focus:border-cyan-500/50 transition-all shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          {selectedDefect ? (
            <span className="font-semibold text-slate-100 truncate">
              {selectedDefect.name}
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                {selectedDefect.category}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-slate-800">
          
          {/* Search Input */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou categoria do defeito..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-slate-900 p-1">
            {filteredDefects.length === 0 ? (
              <div className="p-4 text-center space-y-3">
                <div className="text-xs text-slate-400">
                  {searchTerm.trim() ? (
                    <>Nenhum desvio encontrado para &quot;<span className="text-slate-200 font-semibold">{searchTerm}</span>&quot;</>
                  ) : (
                    'Nenhum desvio encontrado'
                  )}
                </div>
                {onCreateNew && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateNew(searchTerm.trim() || undefined);
                      setIsOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {searchTerm.trim()
                        ? `Cadastrar "${searchTerm.trim()}" como novo defeito`
                        : 'Cadastrar novo defeito'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredDefects.map(defect => {
                  const isSelected = defect.id === selectedDefectId;

                  return (
                    <button
                      key={defect.id}
                      type="button"
                      onClick={() => {
                        onSelectDefect(defect.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-200 font-semibold'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`truncate ${isSelected ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                            {defect.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400">
                            {defect.category}
                          </span>
                        </div>

                        {defect.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {defect.description}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Option to create if searched term doesn't match an exact defect */}
                {onCreateNew && searchTerm.trim() && !hasExactMatch && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNew(searchTerm.trim());
                        setIsOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-dashed border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <span>Cadastrar &quot;<strong className="text-cyan-300">{searchTerm.trim()}</strong>&quot; como novo defeito</span>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer stats */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Exibindo {filteredDefects.length} de {defects.length} desvios</span>
            {onCreateNew ? (
              <button
                type="button"
                onClick={() => {
                  onCreateNew(searchTerm.trim() || undefined);
                  setIsOpen(false);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Novo Defeito</span>
              </button>
            ) : (
              <span className="text-cyan-400/80 font-medium">Use a busca para filtrar</span>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
