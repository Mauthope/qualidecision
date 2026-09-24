'use client';

import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  BarChart3, 
  Search, 
  Info, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Camera, 
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

interface RichChatMessageProps {
  text: string;
  isUser?: boolean;
}

// Limpa vazamentos de metadados internos de prompts
function sanitizeText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\([^)]*CLIENTE EM CONTEXTO[^)]*\)/gi, '')
    .replace(/\s*\([^)]*DADOS OFICIAIS[^)]*\)/gi, '')
    .replace(/\s*SUGESTOES:\s*\[[\s\S]*?\]/gi, '')
    .trim();
}

// Formata texto com negrito e tags de código
function renderInlineText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      // Destaca códigos de clientes ou OPs
      if (/^(\([A-Z0-9-]+\)|CLI-[0-9]+|OP\s*[0-9]+|[0-9]{4,6})$/.test(content.trim())) {
        return (
          <strong key={pIdx} className="font-mono font-bold text-cyan-300 px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-[11px] inline-block mx-0.5">
            {content}
          </strong>
        );
      }
      return (
        <strong key={pIdx} className="font-bold text-white tracking-tight">
          {content}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={pIdx} className="px-1.5 py-0.5 rounded font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-800/60 text-[11px] mx-0.5">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// Renderiza valores com badges visuais elegantes (ex: scores, quantidades, moedas)
function renderValueWithBadges(valueStr: string) {
  // Score de Tolerância (ex: 32/100, 96/100)
  const scoreMatch = valueStr.match(/\b([0-9]{1,3})\/100\b/);
  if (scoreMatch) {
    const scoreVal = parseInt(scoreMatch[1], 10);
    const badgeColor = scoreVal <= 45 
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
      : scoreVal <= 74 
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    
    const label = scoreVal <= 45 
      ? '⭐ Ranking A (Crítico / Rígido)' 
      : scoreVal <= 74 
      ? '🥈 Ranking B (Moderado)' 
      : '🥉 Ranking C (Flexível)';

    const before = valueStr.substring(0, scoreMatch.index);
    const after = valueStr.substring((scoreMatch.index || 0) + scoreMatch[0].length);

    return (
      <span>
        {renderInlineText(before)}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs border ${badgeColor} shadow-sm mx-1`}>
          <span>{scoreVal}/100</span>
          <span className="text-[10px] font-sans font-semibold opacity-90">• {label}</span>
        </span>
        {renderInlineText(after)}
      </span>
    );
  }

  // Destaque de quantidades e ocorrências (ex: 54 reclamações, 43 lotes, 150.300 unidades)
  return renderInlineText(valueStr);
}

export const RichChatMessage: React.FC<RichChatMessageProps> = ({ text, isUser = false }) => {
  if (isUser) {
    return <div className="whitespace-pre-line text-white">{text}</div>;
  }

  const clean = sanitizeText(text);
  const lines = clean.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-200">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();

        // 1. Linha vazia
        if (!trimmed) {
          return <div key={lIdx} className="h-1.5" />;
        }

        // 2. Divisor horizontal (--- ou ***)
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return (
            <div
              key={lIdx}
              className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/80 to-transparent my-3"
            />
          );
        }

        // 3. Títulos Principais (###, ##, #)
        const h3Match = trimmed.match(/^#{1,3}\s+(.*)/);
        if (h3Match) {
          const title = h3Match[1].trim();

          // Paleta visual baseada no ícone/contexto
          let borderTheme = 'border-cyan-500 bg-gradient-to-r from-cyan-950/60 via-cyan-900/20 to-transparent text-cyan-100';
          let icon = <Info className="w-4 h-4 text-cyan-400 shrink-0" />;

          if (title.includes('🚨') || /reclamac|queixa|ocorrencia|alerta/i.test(title)) {
            borderTheme = 'border-rose-500 bg-gradient-to-r from-rose-950/60 via-rose-900/20 to-transparent text-rose-100';
            icon = <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
          } else if (title.includes('📊') || /visao\s+geral|resumo|estatistica/i.test(title)) {
            borderTheme = 'border-cyan-500 bg-gradient-to-r from-cyan-950/60 via-cyan-900/20 to-transparent text-cyan-100';
            icon = <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />;
          } else if (title.includes('🔍') || /contexto|tolerancia/i.test(title)) {
            borderTheme = 'border-teal-500 bg-gradient-to-r from-teal-950/60 via-teal-900/20 to-transparent text-teal-100';
            icon = <Search className="w-4 h-4 text-teal-400 shrink-0" />;
          } else if (title.includes('⚠️') || /implicac|cuidado|risco/i.test(title)) {
            borderTheme = 'border-amber-500 bg-gradient-to-r from-amber-950/60 via-amber-900/20 to-transparent text-amber-100';
            icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
          } else if (title.includes('🏭') || /cliente|unidade/i.test(title)) {
            borderTheme = 'border-purple-500 bg-gradient-to-r from-purple-950/60 via-purple-900/20 to-transparent text-purple-100';
            icon = <Building2 className="w-4 h-4 text-purple-400 shrink-0" />;
          } else if (title.includes('🛡️') || title.includes('✅')) {
            borderTheme = 'border-emerald-500 bg-gradient-to-r from-emerald-950/60 via-emerald-900/20 to-transparent text-emerald-100';
            icon = <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
          }

          // Remove emojis redundantes já cobertos pelo ícone para deixar o visual limpo
          const cleanTitle = title.replace(/^[🚨📊🔍⚠️🏭🛡️✅🛑📦📋📷💡📈]+\s*/, '');

          return (
            <div
              key={lIdx}
              className={`border-l-4 ${borderTheme} p-3 rounded-r-2xl my-2 shadow-md flex items-center gap-2.5`}
            >
              {icon}
              <h3 className="font-heading font-extrabold text-xs sm:text-sm tracking-wide">
                {renderInlineText(cleanTitle)}
              </h3>
            </div>
          );
        }

        // 4. Subtítulos de Seção (####)
        const h4Match = trimmed.match(/^#{4}\s+(.*)/);
        if (h4Match) {
          const subTitle = h4Match[1].trim();
          let icon = <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;

          if (subTitle.includes('📊')) icon = <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
          else if (subTitle.includes('🔍')) icon = <Search className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
          else if (subTitle.includes('⚠️')) icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
          else if (subTitle.includes('🚨')) icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />;

          const cleanSub = subTitle.replace(/^[🚨📊🔍⚠️🏭🛡️✅🛑📦📋📷💡📈]+\s*/, '');

          return (
            <div key={lIdx} className="pt-2 pb-1">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/70 text-xs font-bold uppercase tracking-wider text-slate-200 shadow-sm">
                {icon}
                <span>{cleanSub}</span>
              </span>
            </div>
          );
        }

        // 5. Linhas com Marcadores (*, -, •, + ou números)
        const isBullet = /^([*•\-+]|\d+\.)\s+/.test(trimmed);
        if (isBullet) {
          const bulletContent = trimmed.replace(/^([*•\-+]|\d+\.)\s+/, '');
          
          // Verifica se é par Chave: Valor (ex: "Total de Queixas Registradas: 54 reclamações")
          const colonIdx = bulletContent.indexOf(':');
          
          if (colonIdx > 0 && colonIdx < 45) {
            const keyLabel = bulletContent.slice(0, colonIdx).replace(/\*\*/g, '').trim();
            const valueStr = bulletContent.slice(colonIdx + 1).trim();

            const isRisk = /risco\s+elevado|alto\s+risco|atencao\s+critica/i.test(keyLabel);
            const isCaution = /comunicacao\s+essencial|regra\s+operacional|atencao/i.test(keyLabel);
            const isSuccess = /flexibilidade|concessoes|zero\s+reclamacoes/i.test(keyLabel);

            if (isRisk) {
              return (
                <div key={lIdx} className="p-3 rounded-xl bg-rose-950/25 border border-rose-800/40 text-rose-200 my-1.5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold">{keyLabel}: </strong>
                      <span>{renderInlineText(valueStr)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (isCaution) {
              return (
                <div key={lIdx} className="p-3 rounded-xl bg-amber-950/25 border border-amber-800/40 text-amber-200 my-1.5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-200 font-bold">{keyLabel}: </strong>
                      <span>{renderInlineText(valueStr)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (isSuccess) {
              return (
                <div key={lIdx} className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-emerald-200 my-1.5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-200 font-bold">{keyLabel}: </strong>
                      <span>{renderInlineText(valueStr)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            // Marcador chave-valor padrão destacado
            return (
              <div key={lIdx} className="flex items-start gap-2.5 py-1 px-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400/80 mt-2 shrink-0 ring-4 ring-cyan-500/10" />
                <div className="flex-1">
                  <span className="font-semibold text-slate-100">{keyLabel}: </span>
                  <span className="text-slate-300">{renderValueWithBadges(valueStr)}</span>
                </div>
              </div>
            );
          }

          // Marcador descritivo comum
          return (
            <div key={lIdx} className="flex items-start gap-2.5 py-1 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
              <div className="flex-1 text-slate-300">
                {renderInlineText(bulletContent)}
              </div>
            </div>
          );
        }

        // 6. Chamadas especiais de chão de fábrica (🏭, 🚨, 🛡️, 📋, 📷)
        const isClientSection = trimmed.startsWith('🏭');
        const isAlertSection = trimmed.startsWith('🚨');
        const isShieldSection = trimmed.startsWith('🛡️');
        const isChecklistSection = trimmed.startsWith('📋');
        const isCameraSection = trimmed.startsWith('📷');

        if (isClientSection || isAlertSection || isShieldSection || isChecklistSection || isCameraSection) {
          let calloutTheme = 'border-l-4 border-cyan-400 bg-gradient-to-r from-cyan-950/50 to-transparent text-cyan-100 p-2.5 rounded-r-xl my-1.5 font-semibold';
          if (isAlertSection) calloutTheme = 'border-l-4 border-rose-500 bg-gradient-to-r from-rose-950/40 to-transparent text-rose-100 p-2 rounded-r-lg my-1.5 font-bold uppercase';
          if (isShieldSection) calloutTheme = 'border-l-4 border-cyan-500 bg-gradient-to-r from-cyan-950/40 to-transparent text-cyan-100 p-2 rounded-r-lg my-1.5 font-bold uppercase';
          if (isChecklistSection) calloutTheme = 'border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-950/40 to-transparent text-emerald-100 p-2 rounded-r-lg my-1.5 font-bold uppercase';
          if (isCameraSection) calloutTheme = 'border-l-4 border-purple-500 bg-gradient-to-r from-purple-950/40 to-transparent text-purple-100 p-2 rounded-r-lg my-1.5 font-bold uppercase';

          return (
            <div key={lIdx} className={calloutTheme}>
              {renderInlineText(trimmed)}
            </div>
          );
        }

        // 7. Parágrafo comum (ex: frases de introdução e conclusão)
        return (
          <p key={lIdx} className="text-slate-300 my-1 leading-relaxed">
            {renderInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
