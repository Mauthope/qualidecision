'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuality } from '@/context/QualityContext';
import { UserProfile, UserRole } from '@/types';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCog,
  RefreshCw,
  Building
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user: currentUser, profile: currentProfile, isAdmin, updateUserRole } = useAuth();
  const { showToast } = useQuality();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setProfiles(
          data.map(p => ({
            id: p.id,
            email: p.email,
            fullName: p.full_name || p.email.split('@')[0],
            role: (p.role as UserRole) || 'visualizador',
            department: p.department || 'Qualidade',
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }))
        );
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfis:', err);
      showToast('Erro ao carregar lista de usuários.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen, fetchProfiles]);

  if (!isOpen) return null;

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!isAdmin) {
      showToast('Apenas administradores podem alterar papéis de usuários.', 'error');
      return;
    }

    if (targetUser.id === currentUser?.id && newRole !== 'admin') {
      showToast('Você não pode revogar seu próprio papel de Administrador.', 'warning');
      return;
    }

    setUpdatingUserId(targetUser.id);
    try {
      const res = await updateUserRole(targetUser.id, newRole);
      if (res.success) {
        setProfiles(prev =>
          prev.map(p => (p.id === targetUser.id ? { ...p, role: newRole } : p))
        );
        showToast(
          `Nível de acesso de ${targetUser.fullName} alterado para ${
            newRole === 'admin' ? 'Administrador' : newRole === 'editor' ? 'Editor' : 'Visualizador'
          }!`,
          'success'
        );
      } else {
        showToast(res.error || 'Falha ao atualizar nível do usuário.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RF';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredProfiles = profiles.filter(p => {
    const s = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(s) ||
      p.email.toLowerCase().includes(s) ||
      (p.department && p.department.toLowerCase().includes(s)) ||
      p.role.toLowerCase().includes(s)
    );
  });

  const countAdmins = profiles.filter(p => p.role === 'admin').length;
  const countEditors = profiles.filter(p => p.role === 'editor').length;
  const countViewers = profiles.filter(p => p.role === 'visualizador').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-cyan-500/20 border border-purple-500/30 text-purple-300 shadow-md">
              <UserCog className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading flex items-center gap-2">
                <span>Gestão de Usuários & Níveis de Acesso</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  Painel Admin
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gerencie permissões de edição e exclusão de colaboradores @rafitec.com.br
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Count Summary */}
        <div className="grid grid-cols-3 gap-3 p-5 sm:p-6 bg-slate-950 border-b border-slate-800/60">
          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-purple-300 font-semibold">Administradores</div>
              <div className="text-xl font-bold font-mono text-purple-200 mt-0.5">{countAdmins}</div>
            </div>
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>

          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-cyan-300 font-semibold">Editores</div>
              <div className="text-xl font-bold font-mono text-cyan-200 mt-0.5">{countEditors}</div>
            </div>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Visualizadores</div>
              <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">{countViewers}</div>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800/60 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuário por nome, e-mail ou setor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            onClick={fetchProfiles}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recarregar usuários"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>

        {/* Users List Container */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Carregando contas cadastradas...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">Nenhum usuário encontrado com o termo buscado.</p>
            </div>
          ) : (
            filteredProfiles.map(u => {
              const isMe = u.id === currentUser?.id;
              const isUpdating = updatingUserId === u.id;

              return (
                <div
                  key={u.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* User Profile Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                        u.role === 'admin'
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                          : u.role === 'editor'
                          ? 'bg-gradient-to-tr from-cyan-500 to-teal-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {getInitials(u.fullName)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{u.fullName}</span>
                        {isMe && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">{u.email}</div>
                      {u.department && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-600" />
                          <span>{u.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role Selector & Badge */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <div className="relative">
                      <select
                        value={u.role}
                        disabled={isUpdating || (isMe && u.role === 'admin')}
                        onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                        className={`text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border focus:outline-none transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          u.role === 'admin'
                            ? 'bg-purple-950/80 border-purple-700 text-purple-200'
                            : u.role === 'editor'
                            ? 'bg-cyan-950/80 border-cyan-700 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <option value="visualizador">👁️ Visualizador (Apenas Leitura)</option>
                        <option value="editor">✏️ Editor (Criar e Excluir)</option>
                        <option value="admin">👑 Administrador (Acesso Total)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Alterações de nível têm efeito <strong>imediato</strong> no sistema.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
