'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  MailCheck
} from 'lucide-react';
import { useAuth, isValidRafitecEmail, CORPORATE_DOMAIN } from '@/context/AuthContext';

type Mode = 'signin' | 'signup' | 'forgot_password' | 'signup_confirmation' | 'reset_password';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isLoading,
    isRecoveryMode,
    signIn,
    signUp,
    sendPasswordResetEmail,
    updatePassword
  } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Qualidade');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState('');

  // Handle URL search parameters and recovery hash
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    const paramMode = searchParams.get('mode');
    const errorParam = searchParams.get('error_description') || searchParams.get('error');

    if (confirmed === 'true') {
      setSuccessMsg('🎉 E-mail corporativo confirmado com sucesso! Você já pode entrar com sua senha.');
      setMode('signin');
    }

    if (paramMode === 'reset_password' || isRecoveryMode) {
      setMode('reset_password');
    }

    if (errorParam) {
      setErrorMsg(`Aviso: ${decodeURIComponent(errorParam)}`);
    }

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setMode('reset_password');
    }
  }, [searchParams, isRecoveryMode]);

  // If already authenticated and NOT resetting password, redirect to home
  useEffect(() => {
    if (!isLoading && user && mode !== 'reset_password') {
      router.push('/');
    }
  }, [user, isLoading, mode, router]);

  // Real-time email validation
  const cleanEmail = email.trim().toLowerCase();
  const hasTypedEmail = cleanEmail.length > 0;
  const isCorporateEmailValid = isValidRafitecEmail(cleanEmail);
  const hasWrongDomain = hasTypedEmail && cleanEmail.includes('@') && !cleanEmail.endsWith('rafitec.com.br');

  const handleAppendDomain = () => {
    if (!cleanEmail) {
      setEmail('nome' + CORPORATE_DOMAIN);
      return;
    }
    const userPart = cleanEmail.split('@')[0];
    setEmail(`${userPart}${CORPORATE_DOMAIN}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // ================= FORGOT PASSWORD MODE =================
    if (mode === 'forgot_password') {
      if (!isValidRafitecEmail(cleanEmail)) {
        setErrorMsg(`Por favor, informe seu e-mail corporativo ${CORPORATE_DOMAIN}`);
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await sendPasswordResetEmail(cleanEmail);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao enviar e-mail de recuperação.');
        } else {
          setSuccessMsg(`Link de redefinição enviado com sucesso para ${cleanEmail}. Verifique sua caixa de entrada.`);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Erro inesperado.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ================= RESET PASSWORD MODE =================
    if (mode === 'reset_password') {
      if (newPassword.length < 6) {
        setErrorMsg('A nova senha deve conter no mínimo 6 caracteres.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setErrorMsg('A confirmação de senha não confere.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await updatePassword(newPassword);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao redefinir a senha.');
        } else {
          setSuccessMsg('Senha redefinida com sucesso! Acessando o sistema...');
          setTimeout(() => {
            router.push('/');
          }, 1200);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Erro ao processar alteração de senha.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ================= SIGNIN / SIGNUP MODES =================
    // Common validation
    if (!isValidRafitecEmail(cleanEmail)) {
      setErrorMsg(`Acesso restrito: Por favor, informe um e-mail institucional corporativo ${CORPORATE_DOMAIN}`);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(cleanEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao efetuar login.');
        } else {
          router.push('/');
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Por favor, informe seu nome completo corporativo.');
          setIsSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('A confirmação de senha não confere com a senha digitada.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp(fullName.trim(), cleanEmail, password, department);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao criar conta.');
        } else if (res.requiresEmailConfirmation) {
          setLastRegisteredEmail(cleanEmail);
          setMode('signup_confirmation');
        } else {
          setSuccessMsg('Conta corporativa criada com sucesso! Redirecionando...');
          setTimeout(() => {
            router.push('/');
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060a13] flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 animate-spin">
          <div className="w-full h-full bg-[#060a13] rounded-[14px]" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-wider text-slate-500 uppercase">
          Verificando credenciais corporativas...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a13] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience / Industrial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/10 via-teal-500/10 to-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Header / Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-500/20 mb-4 hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
            Perfil<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Cliente</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Controle de Qualidade Industrial & Concessões
          </p>

          {/* Corporate domain enforcement pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-mono shadow-inner">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Acesso Restrito: <strong>@rafitec.com.br</strong></span>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs (Only shown in signin and signup modes) */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-semibold">{successMsg}</div>
            </div>
          )}

          {/* ================= VIEW: SIGNUP EMAIL CONFIRMATION ================= */}
          {mode === 'signup_confirmation' ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/50">
                <MailCheck className="w-9 h-9 animate-bounce" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Quase lá! Confirme seu e-mail
                </h2>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Enviamos um link oficial de ativação institucional para:
                </p>
                <div className="mt-2 inline-block px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-semibold">
                  {lastRegisteredEmail || email}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Instruções de Acesso:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
                  <li>Abra sua caixa postal no Webmail / Outlook da Rafitec.</li>
                  <li>Localize a mensagem do <strong>Supabase / QualiDecision</strong>.</li>
                  <li>Clique no botão ou link de confirmação para ativar sua conta.</li>
                  <li>Retorne e faça seu login imediatamente.</li>
                </ol>
                <p className="text-[11px] text-slate-500 pt-1">
                  * Caso não encontre em alguns minutos, verifique a pasta de <em>Lixo Eletrônico / Spam</em>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Voltar para o Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : mode === 'forgot_password' ? (
            /* ================= VIEW: FORGOT PASSWORD ================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                  <span>Recuperação de Senha</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Informe seu e-mail corporativo cadastrado para receber o link de redefinição de senha.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                    E-mail Corporativo <span className="text-rose-400">*</span>
                  </label>
                  {!cleanEmail.endsWith('@rafitec.com.br') && (
                    <button
                      type="button"
                      onClick={handleAppendDomain}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
                    >
                      + {CORPORATE_DOMAIN}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@rafitec.com.br"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (hasTypedEmail && !isCorporateEmailValid)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isSubmitting || (hasTypedEmail && !isCorporateEmailValid)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 hover:opacity-95 shadow-cyan-500/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Enviando link...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Link de Recuperação</span>
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para tela de login</span>
                </button>
              </div>
            </form>
          ) : mode === 'reset_password' ? (
            /* ================= VIEW: RESET PASSWORD FORM ================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                  <span>Redefinir Senha de Acesso</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Digite sua nova senha de segurança corporativa abaixo.
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Nova Senha <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Confirmar Nova Senha <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || newPassword.length < 6 || newPassword !== confirmNewPassword}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isSubmitting || newPassword.length < 6 || newPassword !== confirmNewPassword
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 hover:opacity-95 shadow-cyan-500/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <>
                    <span>Atualizar Senha & Acessar</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para tela de login</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW: SIGNIN & SIGNUP FORMS ================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If Sign Up: Name & Department */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                      Nome Completo <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Mauricio Grigol"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                      Setor / Departamento
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      >
                        <option value="Qualidade">Garantia / Controle da Qualidade</option>
                        <option value="Produção">Produção Industrial</option>
                        <option value="Engenharia">Engenharia de Processos</option>
                        <option value="SAC">SAC / Atendimento ao Cliente</option>
                        <option value="PCP">PCP / Planejamento</option>
                        <option value="Diretoria">Diretoria / Gestão</option>
                        <option value="Outro">Outro Departamento</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Email Field with Live Domain Hint */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                    E-mail Corporativo <span className="text-rose-400">*</span>
                  </label>
                  {!cleanEmail.endsWith('@rafitec.com.br') && (
                    <button
                      type="button"
                      onClick={handleAppendDomain}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
                    >
                      + {CORPORATE_DOMAIN}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@rafitec.com.br"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                      hasWrongDomain
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : isCorporateEmailValid
                        ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                    }`}
                  />
                </div>

                {/* Dynamic Helper Text */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  {hasWrongDomain ? (
                    <span className="text-rose-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Domínio rejeitado. Somente <strong>@rafitec.com.br</strong> é aceito.
                    </span>
                  ) : isCorporateEmailValid ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      E-mail institucional Rafitec válido
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[10px]">
                      Identificação exclusiva institucional
                    </span>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Senha de Acesso <span className="text-rose-400">*</span>
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (only in sign up mode) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                    Confirmar Senha <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Role Notice on Sign Up */}
              {mode === 'signup' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ativação & Níveis de Acesso (RBAC)</span>
                  </div>
                  <p>
                    Ao cadastrar, você receberá um link de confirmação do Supabase em seu e-mail institucional. Seu perfil inicial será <strong>Visualizador</strong>.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (hasTypedEmail && !isCorporateEmailValid)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                  isSubmitting || (hasTypedEmail && !isCorporateEmailValid)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 hover:opacity-95 shadow-cyan-500/20 hover:shadow-cyan-500/35'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <span>Acessar o Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Criar Minha Conta Institucional</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1 font-mono">
          <p>Rafitec S.A. • Sistema de Concessões & Qualidade</p>
          <p className="text-[11px] text-slate-600">Desenvolvido por Mauricio Grigol</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060a13] flex flex-col items-center justify-center text-slate-400">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 animate-spin">
            <div className="w-full h-full bg-[#060a13] rounded-[14px]" />
          </div>
          <p className="mt-4 text-xs font-mono tracking-wider text-slate-500 uppercase">
            Carregando ambiente seguro...
          </p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
