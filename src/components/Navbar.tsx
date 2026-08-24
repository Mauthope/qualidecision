'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  Send,
  AlertCircle,
  BarChart3,
  Bot,
  PlusCircle,
  Menu,
  X,
  Database,
  Search,
  Calculator
} from 'lucide-react';
import { useQuality } from '@/context/QualityContext';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { ExportImportModal } from '@/components/modals/ExportImportModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { openAiDrawer, searchQuery, setSearchQuery, stats } = useQuality();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      label: 'Clientes & Tolerância',
      shortLabel: 'Clientes',
      href: '/clientes',
      icon: <Users className="w-4 h-4" />
    },
    {
      label: 'Envios / Concessões',
      shortLabel: 'Envios',
      href: '/envios',
      icon: <Send className="w-4 h-4" />
    },
    {
      label: 'Reclamações SAC',
      shortLabel: 'Reclamações',
      href: '/reclamacoes',
      icon: <AlertCircle className="w-4 h-4" />,
      badge: stats.activeComplaintsCount > 0 ? stats.activeComplaintsCount : undefined
    },
    {
      label: 'Indicadores de Lucro',
      shortLabel: 'Indicadores',
      href: '/indicadores',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      label: 'Memorial de Cálculo',
      shortLabel: 'Memorial',
      href: '/memorial',
      icon: <Calculator className="w-4 h-4" />
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            
            {/* Brand Logo & Author Credit */}
            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:text-emerald-300 transition-colors" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold tracking-tight text-lg sm:text-xl text-white">
                      Quali<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Decision</span>
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 hidden 2xl:inline leading-none font-medium">
                    Inteligência de Qualidade & Concessões
                  </span>
                </div>
              </Link>

              {/* Author Credit Badge */}
              <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Criado por</span>
                <strong className="text-cyan-300 font-semibold tracking-wide">Mauricio Grigol</strong>
              </div>
            </div>

            {/* Quick Global Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-md mx-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar cliente (ex: Alisul), lote ou defeito..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 xl:gap-1.5 shrink-0">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-slate-900 text-cyan-300 shadow-md border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.shortLabel || item.label}</span>
                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* O ÚNICO BOTÃO DE IA DO SISTEMA */}
              <button
                onClick={() => openAiDrawer()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 hover:bg-cyan-500/30 transition-all shadow-md shadow-cyan-500/10 group cursor-pointer"
                title="Abrir Assistente de Inteligência Artificial"
              >
                <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Assistente IA</span>
              </button>

              {/* + Novo Envio com Desvio */}
              <button
                onClick={() => setIsConcessionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xl:inline">+ Novo Envio com Desvio</span>
                <span className="xl:hidden">+ Envio</span>
              </button>

              {/* Data & Backup */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                title="Sincronização & Backup"
              >
                <Database className="w-4 h-4" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
                aria-label="Abrir Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 px-4 py-4 space-y-2 backdrop-blur-xl animate-in slide-in-from-top duration-200">
            {/* Mobile Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar cliente, lote..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>

            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAiDrawer();
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-center flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Abrir Assistente IA</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modals */}
      {isConcessionModalOpen && (
        <NewConcessionModal isOpen={isConcessionModalOpen} onClose={() => setIsConcessionModalOpen(false)} />
      )}
      {isExportModalOpen && (
        <ExportImportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      )}
    </>
  );
};
