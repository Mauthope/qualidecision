'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Customer } from '@/types';
import { Search, Check, ChevronDown, Building2, X } from 'lucide-react';

interface Props {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const SearchableCustomerSelect: React.FC<Props> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  placeholder = 'Pesquisar cliente por nome, código ou CNPJ...',
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filter customers by name, code or cnpj
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.code && c.code.toLowerCase().includes(term)) ||
      (c.cnpj && c.cnpj.toLowerCase().includes(term)) ||
      (c.cityState && c.cityState.toLowerCase().includes(term))
    );
  });

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
          value={selectedCustomerId}
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
          <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
          {selectedCustomer ? (
            <span className="font-semibold text-slate-100 truncate">
              {selectedCustomer.name}
              {selectedCustomer.code && (
                <span className="ml-1.5 text-slate-400 font-normal font-mono text-[11px]">
                  ({selectedCustomer.code})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedCustomer && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Score: {selectedCustomer.overallToleranceScore}%
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
        </div>
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-slate-800">
          
          {/* Search Input */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Digite o nome, código ou CNPJ..."
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
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhum cliente encontrado para &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredCustomers.map(customer => {
                const isSelected = customer.id === selectedCustomerId;

                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(customer.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-200 font-semibold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`truncate ${isSelected ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                          {customer.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {customer.code && (
                          <span className="font-mono text-slate-400">{customer.code}</span>
                        )}
                        {customer.cityState && (
                          <span>• {customer.cityState}</span>
                        )}
                        {customer.segment && (
                          <span>• {customer.segment}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                        Score: {customer.overallToleranceScore}%
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer stats */}
          <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-900/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Exibindo {filteredCustomers.length} de {customers.length} clientes</span>
            <span className="text-cyan-400/80 font-medium">Use a busca para filtrar</span>
          </div>

        </div>
      )}
    </div>
  );
};
