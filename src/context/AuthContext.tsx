'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isRecoveryMode: boolean;
  setIsRecoveryMode: (val: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
    department?: string
  ) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const CORPORATE_DOMAIN = '@rafitec.com.br';

export function isValidRafitecEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1] === 'rafitec.com.br';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Fetch or refresh profile from public.profiles
  const fetchProfile = useCallback(async (userId: string, email?: string, userMetadata?: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Erro ao consultar public.profiles:', error.message);
      }

      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name || email?.split('@')[0] || 'Usuário Rafitec',
          role: (data.role as UserRole) || 'visualizador',
          department: data.department || 'Qualidade',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      } else {
        // Fallback if trigger hasn't finished or was not run
        const fallbackRole: UserRole = (email && email.toLowerCase() === 'mauricio.grigol@rafitec.com.br') ? 'admin' : 'visualizador';
        const fallbackName = userMetadata?.full_name || email?.split('@')[0] || 'Usuário Rafitec';

        setProfile({
          id: userId,
          email: email || '',
          fullName: fallbackName,
          role: fallbackRole,
          department: 'Qualidade'
        });

        // Tenta auto-inserir caso não exista
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            email: email,
            full_name: fallbackName,
            role: fallbackRole,
            department: 'Qualidade'
          });
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Falha ao processar perfil do usuário:', err);
    }
  }, []);

  // Listen to auth state changes and initialize
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Aviso ao inicializar sessão:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidRafitecEmail(trimmedEmail)) {
      return {
        success: false,
        error: `Acesso corporativo restrito. Apenas contas com e-mail institucional @rafitec.com.br são aceitas.`
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Credenciais inválidas: Verifique o e-mail ou senha informados.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'E-mail corporativo aguardando confirmação. Verifique sua caixa de entrada.' };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao conectar com o serviço de autenticação.' };
    }
  };

  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    department: string = 'Qualidade'
  ): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      return { success: false, error: 'Por favor, informe seu nome completo corporativo.' };
    }

    if (!isValidRafitecEmail(trimmedEmail)) {
      return {
        success: false,
        error: `Cadastro não permitido: Somente endereços institucionais terminados em ${CORPORATE_DOMAIN} podem ser criados.`
      };
    }

    if (password.length < 6) {
      return { success: false, error: 'A senha de segurança deve conter no mínimo 6 caracteres.' };
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const emailRedirectTo = origin ? `${origin}/login?confirmed=true` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: trimmedName,
            department
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { success: false, error: 'Este e-mail @rafitec.com.br já possui uma conta ativa. Tente fazer login ou redefinir sua senha.' };
        }
        return { success: false, error: error.message };
      }

      // Se Supabase retornar array identities vazio, o email já está cadastrado
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { success: false, error: 'Este e-mail @rafitec.com.br já possui cadastro no sistema. Tente fazer login ou redefinir a senha.' };
      }

      // Se não há sessão ativa imediata ou se o e-mail não estiver com email_confirmed_at preenchido, necessita de confirmação por e-mail
      const requiresEmailConfirmation = !data?.session || !data?.user?.email_confirmed_at;

      if (data?.session && data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email, { full_name: trimmedName, department });
      }

      return {
        success: true,
        requiresEmailConfirmation
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao processar o cadastro institucional.' };
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidRafitecEmail(trimmedEmail)) {
      return {
        success: false,
        error: `Acesso corporativo restrito. Apenas contas institucionais ${CORPORATE_DOMAIN} podem solicitar redefinição.`
      };
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = origin ? `${origin}/login?mode=reset_password` : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao enviar e-mail de recuperação.' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setIsRecoveryMode(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar a senha.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao encerrar sessão:', err);
    } finally {
      setUser(null);
      setProfile(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem alterar permissões de usuários.' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      if (user?.id === userId) {
        await refreshProfile();
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar nível de acesso.' };
    }
  };

  const currentRole: UserRole = profile?.role || 'visualizador';
  const canEdit = currentRole === 'editor' || currentRole === 'admin';
  const canDelete = currentRole === 'editor' || currentRole === 'admin';
  const isAdmin = currentRole === 'admin';
  const isViewer = currentRole === 'visualizador';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        isLoading,
        isAuthenticated: !!user,
        canEdit,
        canDelete,
        isAdmin,
        isViewer,
        isRecoveryMode,
        setIsRecoveryMode,
        signIn,
        signUp,
        sendPasswordResetEmail,
        updatePassword,
        signOut,
        refreshProfile,
        updateUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
};
