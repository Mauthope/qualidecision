'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Send,
  AlertCircle,
  Calculator,
  Bot,
  PlusCircle,
  Database,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useQuality } from '@/context/QualityContext';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { ExportImportModal } from '@/components/modals/ExportImportModal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const pathname = usePathname();
  const { openAiDrawer, stats } = useQuality();
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />
    },
    {
      label: 'Clientes & Tolerância',
      href: '/clientes',
      icon: <Users className="w-5 h-5 shrink-0" />
    },
    {
      label: 'Envios / Concessões',
      href: '/envios',
      icon: <Send className="w-5 h-5 shrink-0" />
    },
    {
      label: 'Reclamações SAC',
      href: '/reclamacoes',
      icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      badge: stats.activeComplaintsCount > 0 ? stats.activeComplaintsCount : undefined
    },
    {
      label: 'Memorial de Cálculo',
      href: '/memorial',
      icon: <Calculator className="w-5 h-5 shrink-0" />
    }
  ];

  const renderNavContent = (isDrawer = false) => {
    const collapsed = !isDrawer && isCollapsed;

    return (
      <div className="flex flex-col h-full justify-between">
        {/* Top Header & Brand */}
        <div>
          <div className={`flex items-center justify-between p-4 border-b border-slate-800/80 ${collapsed ? 'px-3 justify-center' : ''}`}>
            <Link
              href="/"
              onClick={() => isDrawer && onCloseMobile()}
              className="flex items-center gap-3 group overflow-hidden"
              title="PerfilCliente - Início"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:text-emerald-300 transition-colors" />
                </div>
              </div>

              {!collapsed && (
                <div className="flex flex-col overflow-hidden animate-in fade-in duration-200">
                  <span className="font-extrabold tracking-tight text-lg text-white font-heading truncate">
                    Perfil<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Cliente</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    Qualidade & Concessões
                  </span>
                </div>
              )}
            </Link>

            {/* Close button for mobile drawer */}
            {isDrawer && (
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                aria-label="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Collapse / Expand toggle button for desktop */}
            {!isDrawer && (
              <button
                onClick={onToggleCollapse}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
                  collapsed ? 'hidden' : 'block'
                }`}
                title="Recolher menu lateral"
                aria-label="Recolher menu lateral"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapsed expand button at top */}
          {!isDrawer && collapsed && (
            <div className="p-2 flex justify-center border-b border-slate-800/80">
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-xl text-cyan-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
                title="Expandir menu lateral"
                aria-label="Expandir menu lateral"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Author Badge (Expanded mode only) */}
          {!collapsed && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-400">Criado por</span>
                <strong className="text-cyan-300 font-semibold tracking-wide truncate">Mauricio Grigol</strong>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Navegação
              </div>
            )}

            {navItems.map(item => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isDrawer && onCloseMobile()}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active vertical pill indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  )}

                  <div className={`${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </div>

                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full bg-rose-500 text-white font-bold flex items-center justify-center animate-pulse ${
                        collapsed
                          ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px]'
                          : 'px-1.5 py-0.5 text-[10px]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Floating tooltip for collapsed desktop mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                      {item.badge !== undefined && ` (${item.badge} ativas)`}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions Section */}
          <div className="p-3 border-t border-slate-800/60 space-y-2">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Ações Rápidas
              </div>
            )}

            {/* Assistente IA */}
            <button
              onClick={() => {
                if (isDrawer) onCloseMobile();
                openAiDrawer();
              }}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 hover:bg-cyan-500/30 transition-all shadow-md shadow-cyan-500/10 cursor-pointer ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Abrir Assistente de Inteligência Artificial"
            >
              <Bot className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
              {!collapsed && <span className="truncate">Assistente IA</span>}

              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  Assistente IA
                </div>
              )}
            </button>

            {/* Novo Envio com Desvio */}
            <button
              onClick={() => {
                if (isDrawer) onCloseMobile();
                setIsConcessionModalOpen(true);
              }}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all cursor-pointer active:scale-95 ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Novo Envio com Desvio / Concessão"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">Novo Envio</span>}

              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  Novo Envio com Desvio
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer & Tools */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* Backup / Export */}
          <button
            onClick={() => {
              if (isDrawer) onCloseMobile();
              setIsExportModalOpen(true);
            }}
            className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-all cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sincronização & Backup"
          >
            <Database className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            {!collapsed && <span className="truncate">Sincronização & Backup</span>}

            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Sincronização & Backup
              </div>
            )}
          </button>

          {/* Desktop Collapse / Expand Bottom Toggle */}
          {!isDrawer && (
            <button
              onClick={onToggleCollapse}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px] text-slate-400 hover:text-slate-200">
                    Ocultar / Recolher Menu
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-40 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-[width] duration-300 ease-in-out shadow-2xl shadow-black/40 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Off-canvas Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-canvas Drawer Panel */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 shadow-2xl shadow-cyan-950/30 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavContent(true)}
      </aside>

      {/* Modals */}
      {isConcessionModalOpen && (
        <NewConcessionModal
          isOpen={isConcessionModalOpen}
          onClose={() => setIsConcessionModalOpen(false)}
        />
      )}

      {isExportModalOpen && (
        <ExportImportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </>
  );
};
