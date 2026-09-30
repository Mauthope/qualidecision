'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Database,
  Globe,
  Printer,
  Share2,
  CheckCircle2,
  Users,
  Bot,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Check,
  HardDriveDownload,
  Award,
  BadgeCheck,
  ArrowDown
} from 'lucide-react';

export default function SecurityPlanPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');

  const handlePrint = () => {
    // Garante que todas as 5 páginas estejam visíveis antes de imprimir
    if (activeTab !== 'all') {
      setActiveTab('all');
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-8 pb-16 print:space-y-0 print:pb-0 print:m-0 print:p-0">
      {/* ========================================================
          BARRA DE FERRAMENTAS SUPERIOR (OCULTA NA IMPRESSÃO)
          ======================================================== */}
      <div className="no-print bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Documento Técnico Oficial • Revisão 2026.3 • Homologação Ativa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
            Dossiê de Segurança da Informação & Governança de Dados
          </h1>
          <p className="text-xs text-slate-400">
            Apresentação técnica para clientes, auditorias de qualidade e órgãos de conformidade (LGPD & ISO 9001).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegação por abas apenas para leitura em tela */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Completa
            </button>
            <button
              onClick={() => setActiveTab('1')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeTab === '1'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pág 1
            </button>
            <button
              onClick={() => setActiveTab('2')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeTab === '2'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pág 2
            </button>
            <button
              onClick={() => setActiveTab('3')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeTab === '3'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pág 3
            </button>
            <button
              onClick={() => setActiveTab('4')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeTab === '4'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pág 4
            </button>
            <button
              onClick={() => setActiveTab('5')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                activeTab === '5'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pág 5
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            title="Copiar link deste documento"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-2 hover:from-cyan-400 hover:to-emerald-400 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            title="Exportar documento oficial em PDF formatado para A4 sem páginas em branco"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar PDF / Imprimir (A4)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================================
          PÁGINA 1 DO PLANNER (PDF PÁGINA 1)
          CAPA EXECUTIVA, SÍNTESE CORPORATIVA & DEFESA EM PROFUNDIDADE
          ========================================================================================= */}
      {(activeTab === 'all' || activeTab === '1') && (
        <section className="pdf-page glow-card p-6 sm:p-8 print:p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 print:space-y-4 relative overflow-hidden print:overflow-visible shadow-2xl">
          {/* Marca d'água decorativa (apenas em tela) */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />
          <div className="absolute -left-20 -top-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

          {/* Cabeçalho do Documento */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 print:pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 print:w-9 print:h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/25 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-widest text-white uppercase font-heading">
                    RAFITEC S/A
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold uppercase">
                    Divisão de Qualidade & TI
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Plataforma Qualidecision Enterprise • Módulo de Governança
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <div className="text-[11px] font-mono text-slate-400">
                DOC ID: <strong className="text-cyan-300">RAFITEC-SEC-2026-v3.4</strong>
              </div>
              <div className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 inline-block">
                CLASSIFICAÇÃO: CONFIDENCIAL / CLIENTE HOMOLOGADO
              </div>
            </div>
          </div>

          {/* Título de Alto Impacto */}
          <div className="space-y-2 print:space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Arquitetura de Segurança de Nível Industrial</span>
            </div>
            <h2 className="text-xl sm:text-3xl print:text-2xl font-extrabold text-white tracking-tight font-heading leading-tight">
              Plano Diretor de Segurança da Informação, Criptografia & Proteção de Dados
            </h2>
            <p className="text-xs sm:text-sm print:text-xs text-slate-300 leading-relaxed max-w-4xl">
              Este dossiê detalha formalmente a blindagem técnica e operacional do sistema <strong>Qualidecision</strong>,
              desenvolvido para assegurar a inviolabilidade de especificações fabris, tolerâncias críticas de clientes
              (como Aurora, Copacol, Bunge, Alisul, JBS), custos de matéria-prima e histórico de não conformidades.
            </p>
          </div>

          {/* Cards de Métricas de Segurança */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:gap-2.5">
            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>100% Criptografado</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono">TLS 1.3 / HTTPS</div>
              <p className="text-[10px] text-slate-400">Criptografia de ponta a ponta com certificados ECDSA de 256 bits.</p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Zero Indexação</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono">Blindagem 3 Níveis</div>
              <p className="text-[10px] text-slate-400">Bloqueio ativo a robôs de busca e scrapers de Inteligência Artificial.</p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Autenticação OAuth 2.0</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono">JWT HMAC-256</div>
              <p className="text-[10px] text-slate-400">Tokens assinados digitalmente com expiração e rotação de Refresh Token.</p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
                <Database className="w-3.5 h-3.5" />
                <span>Zero Trust Database</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono">BEFORE INSERT Gate</div>
              <p className="text-[10px] text-slate-400">Gatilho no motor do banco rejeitando e-mails externos antes da escrita.</p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Controle Granular</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono">Matriz RBAC + RLS</div>
              <p className="text-[10px] text-slate-400">PostgreSQL Row Level Security isolando dados no nível de linha.</p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Mídias & Evidências</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono">Storage Assinado</div>
              <p className="text-[10px] text-slate-400">Fotos de SAC e lotes protegidas contra visualização não autorizada.</p>
            </div>
          </div>

          {/* Sumário Executivo para o Cliente */}
          <div className="p-4 print:p-3 rounded-xl bg-gradient-to-r from-cyan-950/30 to-slate-900/80 border border-cyan-500/25 space-y-2">
            <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-cyan-400" />
              <span>Garantia Institucional de Confidencialidade aos Clientes Homologados</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              O sistema <strong>Qualidecision</strong> foi concebido sobre os preceitos de <strong>Defesa em Profundidade (Defense-in-Depth)</strong>.
              Nenhum dado produtivo é exposto a motores de busca públicos, nenhum usuário externo tem capacidade técnica de criar contas
              sem pertencer ao domínio corporativo autenticado, e toda a comunicação de rede trafega criptografada por chaves assimétricas de alta resistência.
            </p>
          </div>

          {/* Rodapé da Página 1 */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Rafitec S/A • Sistema de Apoio à Decisão de Qualidade</span>
            <span>Página 1 de 5</span>
          </div>
        </section>
      )}

      {/* =========================================================================================
          PÁGINA 2 DO PLANNER (PDF PÁGINA 2)
          CAMADA DE BORDA, HTTPS & O ESQUEMA DE BLOQUEIO DE ROBÔS / BUSCADORES
          ========================================================================================= */}
      {(activeTab === 'all' || activeTab === '2') && (
        <section className="pdf-page pdf-page-break glow-card p-6 sm:p-8 print:p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 print:space-y-3 relative overflow-hidden print:overflow-visible shadow-2xl">
          {/* Cabeçalho da Página 2 */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" /> SEÇÃO 1: CAMADA DE BORDA, PROTOCOLO HTTPS & ANTI-INDEXAÇÃO
            </span>
            <span>DOC-SEC-2026-v3.4</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
              1. Criptografia em Trânsito (HTTPS/TLS 1.3) & Proteção Anti-Indexação
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              A primeira linha de defesa atua na camada de transporte (Rede e HTTP). Toda conexão entre o navegador do usuário,
              o terminal PWA do chão de fábrica e os servidores é forçada via TLS 1.3. Paralelamente,
              uma barreira em 3 camadas impede que motores de busca públicos e IAs rastreiem ou indexem as rotas do sistema.
            </p>
          </div>

          {/* O ESQUEMA VISUAL 1: Bloqueio de Robôs */}
          <div className="p-4 print:p-2.5 rounded-xl bg-[#090d16] border border-cyan-500/30 space-y-3 print:space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono">
                  Esquema Arquitetural 1: Bloqueio Total de Robôs de Busca e IA (3 Camadas)
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 font-mono">Defense in Depth</span>
            </div>

            {/* FLUXOGRAMA VISUAL REFINADO */}
            <div className="flex flex-col items-center justify-center space-y-2 print:space-y-1 text-center text-xs">
              
              {/* NÓ TOPO: ROBÔ / BUSCADOR / IA */}
              <div className="w-full max-w-sm p-2 print:py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold shadow-md text-[11px]">
                Robô / Buscador / IA (Googlebot, GPTBot, Bingbot)
              </div>

              {/* SETA DESCENDO */}
              <div className="flex flex-col items-center text-cyan-400">
                <div className="w-0.5 h-3 print:h-2 bg-cyan-500" />
                <ArrowDown className="w-3.5 h-3.5 -mt-1" />
              </div>

              {/* NÓ 1: CABEÇALHO HTTP */}
              <div className="w-full max-w-md p-2 print:py-1 rounded-lg bg-slate-900 border-2 border-cyan-500/70 text-cyan-300 font-bold shadow-md shadow-cyan-500/10 text-[11px]">
                1. Cabeçalho de Rede HTTP (X-Robots-Tag)
              </div>

              {/* BIFURCAÇÃO CABEÇALHO */}
              <div className="w-full max-w-xl grid grid-cols-2 gap-3 pt-1">
                {/* LADO ESQUERDO: REJEITADO */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/50 text-[9.5px] font-mono text-rose-300">
                    Rejeitado antes de ler o corpo
                  </div>
                  <div className="w-0.5 h-2 bg-rose-500/60" />
                  <ArrowDown className="w-3 h-3 -mt-1 text-rose-400" />
                  <div className="w-full p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 font-bold text-[10px]">
                    Descarte Imediato da Resposta
                  </div>
                </div>

                {/* LADO DIREITO: SE PROSSEGUIR */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/50 text-[9.5px] font-mono text-cyan-300">
                    Se prosseguir
                  </div>
                  <div className="w-0.5 h-2 bg-cyan-500/60" />
                  <ArrowDown className="w-3 h-3 -mt-1 text-cyan-400" />
                  <div className="w-full p-2 print:py-1 rounded-lg bg-slate-900 border-2 border-cyan-500/70 text-cyan-300 font-bold text-[10px]">
                    2. Arquivo robots.txt (Disallow: /)
                  </div>
                </div>
              </div>

              {/* SEGUNDA BIFURCAÇÃO: A PARTIR DO ROBOTS.TXT */}
              <div className="w-full max-w-xl grid grid-cols-2 gap-3 pt-1">
                {/* LADO ESQUERDO: RESPEITA DIRETIVAS */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-[9.5px] font-mono text-emerald-300">
                    Respeita as diretivas do servidor
                  </div>
                  <div className="w-0.5 h-2 bg-emerald-500/60" />
                  <ArrowDown className="w-3 h-3 -mt-1 text-emerald-400" />
                  <div className="w-full p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 font-bold text-[10px]">
                    Acesso Bloqueado na Raiz
                  </div>
                </div>

                {/* LADO DIREITO: CASO TENTE RENDERIZAR */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/50 text-[9.5px] font-mono text-amber-300">
                    Caso tente renderizar página
                  </div>
                  <div className="w-0.5 h-2 bg-amber-500/60" />
                  <ArrowDown className="w-3 h-3 -mt-1 text-amber-400" />
                  <div className="w-full p-2 print:py-1 rounded-lg bg-slate-900 border-2 border-amber-500/70 text-amber-300 font-bold text-[10px]">
                    3. Metatags HTML (&lt;meta name=&apos;robots&apos;&gt;)
                  </div>
                  <div className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-bold text-[10px]">
                    Não Indexa, Não Segue Links, Não Arquiva
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Cabeçalhos HTTP Ativos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-300 font-mono uppercase text-[9.5px]">
                <tr>
                  <th className="p-2 border-b border-slate-800">Cabeçalho HTTP</th>
                  <th className="p-2 border-b border-slate-800">Valor Configurado</th>
                  <th className="p-2 border-b border-slate-800">Proteção Ativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[10.5px]">
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">X-Robots-Tag</td>
                  <td className="p-2 text-slate-400">noindex, nofollow, noarchive, nosnippet</td>
                  <td className="p-2 text-slate-300">Impede que buscadores indexem APIs, JSONs e PDFs antes do corpo.</td>
                </tr>
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">X-Content-Type-Options</td>
                  <td className="p-2 text-slate-400">nosniff</td>
                  <td className="p-2 text-slate-300">Impede execução de arquivos com tipos MIME fraudulentos.</td>
                </tr>
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">X-Frame-Options</td>
                  <td className="p-2 text-slate-400">SAMEORIGIN</td>
                  <td className="p-2 text-slate-300">Protege contra sequestro de cliques (Clickjacking em iframes externos).</td>
                </tr>
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">Referrer-Policy</td>
                  <td className="p-2 text-slate-400">strict-origin-when-cross-origin</td>
                  <td className="p-2 text-slate-300">Evita vazamento de rotas e parâmetros confidenciais na navegação.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rodapé da Página 2 */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Rafitec S/A • Infraestrutura de Borda e Comunicações Seguras</span>
            <span>Página 2 de 5</span>
          </div>
        </section>
      )}

      {/* =========================================================================================
          PÁGINA 3 DO PLANNER (PDF PÁGINA 3)
          AUTENTICAÇÃO OAUTH 2.0 & O GATILHO HANDLE_BEFORE_USER_INSERT (ZERO-TRUST)
          ========================================================================================= */}
      {(activeTab === 'all' || activeTab === '3') && (
        <section className="pdf-page pdf-page-break glow-card p-6 sm:p-8 print:p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 print:space-y-3 relative overflow-hidden print:overflow-visible shadow-2xl">
          {/* Cabeçalho da Página 3 */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <KeyRound className="w-4 h-4" /> SEÇÃO 2: AUTENTICAÇÃO OAUTH 2.0 & GATILHO ZERO-TRUST NO BANCO
            </span>
            <span>DOC-SEC-2026-v3.4</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
              2. Autenticação OAuth 2.0 & O Guardião do Banco (`handle_before_user_insert`)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              O controle de identidades do Qualidecision utiliza o protocolo <strong>OAuth 2.0</strong> com emissão de
              <strong> Tokens JWT (JSON Web Tokens)</strong> assinados digitalmente. Adicionalmente, adotamos a arquitetura
              <strong> Zero Trust</strong> no banco de dados para aniquilar qualquer tentativa de cadastro fora do domínio institucional.
            </p>
          </div>

          {/* ESQUEMA VISUAL 2: FLUXO ZERO-TRUST DE AUTENTICAÇÃO */}
          <div className="p-4 print:p-2.5 rounded-xl bg-[#090d16] border border-cyan-500/30 space-y-3 print:space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider font-mono">
                  Esquema Arquitetural 2: Validação Atômica no Kernel do PostgreSQL
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 font-mono">Zero Trust Enforcement</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:gap-2 text-xs">
              {/* Etapa 1: Origem */}
              <div className="p-3 print:p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                  <Globe className="w-3.5 h-3.5" />
                  <span>1. Tentativa de Cadastro</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Usuário ou atacante submete e-mail via tela de login ou requisição direta via Postman / script externo.
                </p>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-[9px] text-slate-400">
                  POST /auth/v1/signup
                </div>
              </div>

              {/* Etapa 2: O Porteiro do Banco */}
              <div className="p-3 print:p-2 rounded-xl bg-slate-900 border-2 border-purple-500/50 space-y-1.5 shadow-md shadow-purple-500/10">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                  <Database className="w-3.5 h-3.5" />
                  <span>2. BEFORE INSERT Trigger</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  A função <code className="text-purple-300 font-mono">handle_before_user_insert()</code> intercepta antes de gravar no disco.
                </p>
                <div className="p-1.5 rounded bg-slate-950 border border-purple-900/50 font-mono text-[9px] text-purple-300">
                  IF email NOT LIKE &apos;%@rafitec.com.br&apos; THEN EXCEPTION
                </div>
              </div>

              {/* Etapa 3: Decisão Inegociável */}
              <div className="p-3 print:p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3. Decisão & Perfil</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="p-1 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-semibold">
                    ✅ @rafitec.com.br: Cria usuário + perfil RBAC
                  </div>
                  <div className="p-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 font-semibold">
                    ⛔ Outro domínio: Aborto atômico e Rollback
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Destaque Explicativo do Gatilho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2.5">
            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <h4 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                Por que a validação na tela não é suficiente?
              </h4>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Validações no JavaScript do navegador podem ser ignoradas com Postman ou chamadas HTTP diretas.
                Com a trava dentro da função de gatilho do PostgreSQL, a proteção é de <strong>hardware/banco</strong>:
                nenhuma linha é gravada caso a regra seja descumprida.
              </p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                A Dupla Dinâmica de Segurança
              </h4>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                1. <strong>O Porteiro (`handle_before_user_insert`)</strong>: Roda <em>BEFORE INSERT</em> e barra sumariamente quem não for Rafitec.<br />
                2. <strong>A Recepção (`handle_new_user`)</strong>: Roda <em>AFTER INSERT</em>, vinculando o colaborador aprovado à tabela
                <code className="text-cyan-300 font-mono"> public.profiles</code> com o perfil correto (admin para gestão ou visualizador padrão).
              </p>
            </div>
          </div>

          {/* Rodapé da Página 3 */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Rafitec S/A • Governança de Acessos & Integridade Transacional</span>
            <span>Página 3 de 5</span>
          </div>
        </section>
      )}

      {/* =========================================================================================
          PÁGINA 4 DO PLANNER (PDF PÁGINA 4)
          MATRIZ RBAC, ROW LEVEL SECURITY (RLS) & PROTEÇÃO DE MÍDIAS / IA
          ========================================================================================= */}
      {(activeTab === 'all' || activeTab === '4') && (
        <section className="pdf-page pdf-page-break glow-card p-6 sm:p-8 print:p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 print:space-y-3 relative overflow-hidden print:overflow-visible shadow-2xl">
          {/* Cabeçalho da Página 4 */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Users className="w-4 h-4" /> SEÇÃO 3: CONTROLE DE ACESSO RBAC, RLS & BLINDAGEM DE MÍDIAS
            </span>
            <span>DOC-SEC-2026-v3.4</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
              3. Matriz de Papéis (RBAC), Row Level Security & Proteção de Mídias
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              O modelo de segurança do Qualidecision segue o princípio do menor privilégio. Cada colaborador possui
              permissões expressamente limitadas ao seu papel operacional, e o acesso às tabelas é fiscalizado
              por políticas <strong>Row Level Security (RLS)</strong> ativas no banco de dados.
            </p>
          </div>

          {/* Matriz RBAC */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-300 font-mono uppercase text-[9.5px]">
                <tr>
                  <th className="p-2.5 print:p-1.5 border-b border-slate-800">Recurso / Ação Operacional</th>
                  <th className="p-2.5 print:p-1.5 border-b border-slate-800 text-center">Visualizador (Auditor)</th>
                  <th className="p-2.5 print:p-1.5 border-b border-slate-800 text-center">Operador (Engenharia)</th>
                  <th className="p-2.5 print:p-1.5 border-b border-slate-800 text-center text-cyan-300">Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[10.5px]">
                <tr>
                  <td className="p-2 print:p-1.5 font-sans font-medium text-white">Visualização de Dashboards e Gráficos</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                </tr>
                <tr>
                  <td className="p-2 print:p-1.5 font-sans font-medium text-white">Consulta a Histórico e Tolerâncias de Clientes</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                </tr>
                <tr>
                  <td className="p-2 print:p-1.5 font-sans font-medium text-white">Lançamento de Concessão de Envio</td>
                  <td className="p-2 print:p-1.5 text-center text-rose-400">Bloqueado</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                </tr>
                <tr>
                  <td className="p-2 print:p-1.5 font-sans font-medium text-white">Abertura de Reclamações SAC e Fotos</td>
                  <td className="p-2 print:p-1.5 text-center text-rose-400">Bloqueado</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                  <td className="p-2 print:p-1.5 text-center text-emerald-400">Permitido</td>
                </tr>
                <tr>
                  <td className="p-2 print:p-1.5 font-sans font-medium text-white">Calibração de Fórmulas e Custos de Scrap</td>
                  <td className="p-2 print:p-1.5 text-center text-rose-400">Bloqueado</td>
                  <td className="p-2 print:p-1.5 text-center text-rose-400">Bloqueado</td>
                  <td className="p-2 print:p-1.5 text-center text-cyan-300 font-bold">Exclusivo Admin</td>
                </tr>
                <tr>
                  <td className="p-2 print:p-1.5 font-sans font-medium text-white">Gestão de Perfis de Usuários e Permissões</td>
                  <td className="p-2 print:p-1.5 text-center text-rose-400">Bloqueado</td>
                  <td className="p-2 print:p-1.5 text-center text-rose-400">Bloqueado</td>
                  <td className="p-2 print:p-1.5 text-center text-cyan-300 font-bold">Exclusivo Admin</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Proteção de Mídias e IA Industrial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2.5">
            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <h4 className="text-[11px] font-bold text-teal-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <HardDriveDownload className="w-3.5 h-3.5 text-teal-400" />
                Segurança em Storage de Evidências Fotográficas
              </h4>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Fotos de fardos, laudos técnicos e amostras de SAC são armazenadas em bucket dedicado
                com <strong>sanitização prévia</strong> (conversão para WebP de alta compressão e eliminação automática
                de metadados EXIF como coordenadas GPS do dispositivo), prevenindo rastreamento geográfico acidental.
              </p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                Sensei IA: Blindagem de Chaves e Sanitização
              </h4>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                O assistente de inteligência artificial Sensei opera através de <strong>Server Actions e Endpoints de Servidor isolados</strong>.
                As chaves de API do Google Gemini nunca são enviadas ao navegador do operador, e os prompts são sanitizados
                para impedir injeções semânticas (Prompt Injection).
              </p>
            </div>
          </div>

          {/* Rodapé da Página 4 */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Rafitec S/A • Políticas de Acesso e Salvaguarda de Mídias</span>
            <span>Página 4 de 5</span>
          </div>
        </section>
      )}

      {/* =========================================================================================
          PÁGINA 5 DO PLANNER (PDF PÁGINA 5)
          CONFORMIDADE LGPD, ISO 9001, FAQ PARA CLIENTES & SELO DE HOMOLOGAÇÃO (SEM ASSINATURAS MANUAIS)
          ========================================================================================= */}
      {(activeTab === 'all' || activeTab === '5') && (
        <section className="pdf-page pdf-page-break glow-card p-6 sm:p-8 print:p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 print:space-y-3 relative overflow-hidden print:overflow-visible shadow-2xl">
          {/* Cabeçalho da Página 5 */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Award className="w-4 h-4" /> SEÇÃO 4: CONFORMIDADE NORMATIVA & HOMOLOGAÇÃO
            </span>
            <span>DOC-SEC-2026-v3.4</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
              4. Conformidade Normativa (LGPD & ISO 9001) & Homologação
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              O Qualidecision atende integralmente às exigências de rastreabilidade de produto da norma
              <strong> ABNT NBR ISO 9001:2015</strong> e aos preceitos de privacidade e finalidade da
              <strong> Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>.
            </p>
          </div>

          {/* Alinhamento Normativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2.5">
            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase font-mono">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>ISO 9001:2015 (Seção 7.5 e 8.7)</span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Toda concessão de lote com desvio possui registro indelével contendo autor, data/hora, número de fardos,
                matéria-prima equivalente e justificativa técnica, assegurando auditoria completa para fornecimento a grandes frigoríficos.
              </p>
            </div>

            <div className="p-3.5 print:p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>LGPD (Lei 13.709/2018)</span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                Princípio da necessidade: o sistema não armazena dados de pessoas físicas além do e-mail corporativo institucional.
                Senhas são criptografadas com funções de derivação de chave de via única (Argon2 / bcrypt).
              </p>
            </div>
          </div>

          {/* FAQ Rápido para Clientes Homologados */}
          <div className="p-4 print:p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 print:space-y-1.5">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Perguntas Frequentes (FAQ) de Segurança para Clientes & Parceiros
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2 text-[10.5px] text-slate-300">
              <div className="space-y-0.5">
                <strong className="text-white">Q1: Os dados de compras da nossa empresa podem ser vistos por concorrentes?</strong>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  R: Não. O sistema opera com isolamento rigoroso por RLS e credenciais institucionais restritas aos engenheiros autorizados da Rafitec.
                </p>
              </div>
              <div className="space-y-0.5">
                <strong className="text-white">Q2: Um robô de inteligência artificial ou buscador acha informações no Google?</strong>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  R: Não. O sistema possui blindagem ativa em 3 níveis (X-Robots-Tag nos cabeçalhos HTTP, robots.txt e meta noindex).
                </p>
              </div>
              <div className="space-y-0.5">
                <strong className="text-white">Q3: Onde e como as credenciais de acesso são guardadas?</strong>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  R: Utilizam hashing criptográfico irreversível (bcrypt/Argon2) gerenciado por infraestrutura de banco de dados com certificação SOC-2.
                </p>
              </div>
              <div className="space-y-0.5">
                <strong className="text-white">Q4: As fotos anexadas aos laudos técnicos estão públicas?</strong>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  R: Não. As fotos ficam em storage privado, sem dados de geolocalização EXIF/GPS e protegidas contra acesso externo direto.
                </p>
              </div>
            </div>
          </div>

          {/* Selo Institucional de Homologação em Produção (Sem campos de assinatura manual) */}
          <div className="p-3.5 print:p-2.5 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Selo de Homologação Corporativa & Certificação Interna
                </div>
                <div className="text-[10px] text-slate-400">
                  Rafitec S/A • Engenharia de Qualidade, TI & Governança Industrial
                </div>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold uppercase">
              Status: Ativo & Homologado em Produção
            </div>
          </div>

          {/* Rodapé da Página 5 */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Rafitec S/A • Dossiê Técnico de Segurança • Fim do Documento</span>
            <span>Página 5 de 5</span>
          </div>
        </section>
      )}
    </div>
  );
}
