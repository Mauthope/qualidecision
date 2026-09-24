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
  ChevronRight,
  LogOut,
  Lock,
  UserCog,
  KeyRound,
  Factory
} from 'lucide-react';
import { useQuality } from '@/context/QualityContext';
import { useAuth } from '@/context/AuthContext';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { ExportImportModal } from '@/components/modals/ExportImportModal';
import { UserManagementModal } from '@/components/modals/UserManagementModal';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';

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
  const { openAiDrawer, stats, showToast } = useQuality();
  const { user, profile, role, canEdit, isViewer, isAdmin, signOut } = useAuth();
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'RF';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
    },
    {
      label: 'Chão de Fábrica (IA)',
      href: '/chao-de-fabrica',
      icon: <Factory className="w-5 h-5 shrink-0" />
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
                if (isViewer) {
                  showToast('Acesso Restrito: Seu usuário possui perfil de Visualizador. Apenas Editores e Administradores podem registrar novos envios.', 'warning');
                  return;
                }
                if (isDrawer) onCloseMobile();
                setIsConcessionModalOpen(true);
              }}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isViewer
                  ? 'bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-slate-300'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35'
              } ${collapsed ? 'justify-center' : ''}`}
              title={isViewer ? 'Acesso Restrito: Apenas Editores ou Admins' : 'Novo Envio com Desvio / Concessão'}
            >
              {isViewer ? (
                <Lock className="w-5 h-5 text-slate-500 shrink-0" />
              ) : (
                <PlusCircle className="w-5 h-5 shrink-0" />
              )}
              {!collapsed && (
                <span className="truncate flex items-center justify-between w-full">
                  <span>Novo Envio</span>
                  {isViewer && (
                    <span className="text-[10px] font-mono text-slate-500 font-normal px-1 rounded bg-slate-900 border border-slate-700/50">
                      Leitura
                    </span>
                  )}
                </span>
              )}

              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {isViewer ? 'Novo Envio (Apenas Editores)' : 'Novo Envio com Desvio'}
                </div>
              )}
            </button>

            {/* Gestão de Usuários (Admin Exclusivo) */}
            {isAdmin && (
              <button
                onClick={() => {
                  if (isDrawer) onCloseMobile();
                  setIsUserModalOpen(true);
                }}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-purple-950/40 border border-purple-800/60 text-purple-300 hover:text-purple-100 hover:bg-purple-900/40 transition-all cursor-pointer shadow-md shadow-purple-950/20 ${
                  collapsed ? 'justify-center' : ''
                }`}
                title="Gestão de Usuários & Níveis (Painel do Administrador)"
              >
                <UserCog className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                {!collapsed && (
                  <span className="truncate flex items-center justify-between w-full">
                    <span>Gestão de Usuários</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-900 text-purple-200 border border-purple-700">
                      Admin
                    </span>
                  </span>
                )}

                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    Gestão de Usuários (Admin)
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer & Tools */}
        <div className="p-3 border-t border-slate-800/80 space-y-2.5">
          {/* User Profile Card */}
          {user && (
            <div
              className={`relative group p-2 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-2.5 ${
                collapsed ? 'justify-center flex-col' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-md ${
                    isAdmin
                      ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-purple-500/25'
                      : role === 'editor'
                      ? 'bg-gradient-to-tr from-cyan-500 to-teal-500 text-slate-950 shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {getInitials(profile?.fullName || user.email)}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"
                  title="Conectado à Rafitec"
                />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate" title={profile?.fullName || user.email}>
                    {profile?.fullName || user.email?.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isAdmin
                          ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                          : role === 'editor'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isAdmin ? 'Admin' : role === 'editor' ? 'Editor' : 'Visualizador'}
                    </span>
                    {profile?.department && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[85px]">
                        {profile.department}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Manage Users shortcut button */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(true)}
                  className={`p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all cursor-pointer ${
                    collapsed ? 'mt-1' : ''
                  }`}
                  title="Painel de Usuários & Promoções"
                  aria-label="Gerenciar Usuários"
                >
                  <UserCog className="w-4 h-4" />
                </button>
              )}

              {/* Alterar Senha button */}
              <button
                type="button"
                onClick={() => {
                  if (isDrawer) onCloseMobile();
                  setIsChangePasswordModalOpen(true);
                }}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer ${
                  collapsed ? 'mt-1' : ''
                }`}
                title="Alterar Senha Corporativa"
                aria-label="Alterar Senha"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={() => signOut()}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer ${
                  collapsed ? 'mt-1' : ''
                }`}
                title="Encerrar Sessão / Sair"
                aria-label="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Collapsed hover tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  <div className="font-bold">{profile?.fullName || user.email}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-cyan-300">{role}</span>
                    {profile?.department && <span className="text-[10px] text-slate-400">• {profile.department}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

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

      {isUserModalOpen && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </>
  );
};

