'use client';

import React from 'react';
import { QualityAiChat } from '@/components/chat/QualityAiChat';
import { Bot, Sparkles, ShieldCheck, Database, Camera } from 'lucide-react';

export default function ChatIaPage() {
  return (
    <div className="space-y-4 h-[calc(100vh-10rem)] min-h-[580px] flex flex-col">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                Copilot IA de Qualidade & Decisão de Liberação
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30">
                LLM Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Varredura de reclamações de clientes, histórico de tolerância a desvios e evidências fotográficas
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Camera className="w-3 h-3 text-cyan-400" />
            Galeria de Fotos
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Score de Risco
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Database className="w-3 h-3 text-purple-400" />
            Base ERP / SAC
          </span>
        </div>
      </div>

      {/* Main Full Chat Box */}
      <div className="glow-card flex-1 rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl flex flex-col">
        <QualityAiChat />
      </div>
    </div>
  );
}
