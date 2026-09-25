'use client';

import React from 'react';
import { Trash2, Send, StopCircle, Radio, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

interface VoiceRecordingBarProps {
  duration: number;
  transcript: string;
  audioLevel: number; // 0 to 100
  error?: string | null;
  isFinishing?: boolean;
  isTranscribing?: boolean;
  onCancel: () => void;
  onSend: () => void;
  onStop?: () => void;
}

export const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  duration,
  transcript,
  audioLevel,
  error,
  isFinishing = false,
  isTranscribing = false,
  onCancel,
  onSend,
  onStop
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate 12 dynamic visual bars based on real mic audioLevel
  const bars = Array.from({ length: 12 }, (_, i) => {
    const factor = Math.sin((i / 12) * Math.PI);
    const height = Math.max(15, Math.min(100, (audioLevel * factor * 1.3) + 15));
    return height;
  });

  return (
    <div className="w-full flex flex-col gap-2 p-3 sm:p-4 bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-xl shadow-cyan-950/40 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Recording Status & Timer */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className={`w-3.5 h-3.5 rounded-full ${isFinishing ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'} absolute`} />
            <span className={`w-3 h-3 rounded-full ${isFinishing ? 'bg-amber-500' : 'bg-rose-500'} relative`} />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isFinishing ? 'text-amber-400' : 'text-rose-400'} uppercase tracking-wider hidden sm:inline`}>
              {isFinishing ? 'Concluindo...' : 'Gravando Áudio'}
            </span>
            <span className="font-mono font-bold text-sm text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Real-time Dynamic Equalizer Waves */}
        <div className="flex-1 flex items-center justify-center gap-1 h-8 max-w-xs px-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-75 ${
                isFinishing
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-t from-cyan-500 to-teal-300'
              }`}
              style={{
                height: `${h}%`,
                opacity: audioLevel > 5 || isFinishing ? 1 : 0.4
              }}
            />
          ))}
        </div>

        {/* Action Controls: Cancel, Stop & Review, Send */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={isFinishing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Descartar gravação de áudio"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onStop && (
            <button
              type="button"
              onClick={onStop}
              disabled={isFinishing}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              title="Parar e revisar texto antes de enviar"
            >
              <StopCircle className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-medium hidden md:inline">Revisar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSend}
            disabled={isFinishing}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              isFinishing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:from-cyan-400 hover:to-teal-300 shadow-cyan-500/25 cursor-pointer'
            }`}
            title="Enviar mensagem de voz"
          >
            {isFinishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Finalizando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 fill-slate-950" />
                <span className="hidden sm:inline">Enviar Voz</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error or Live speech recognition transcription status */}
      {error ? (
        <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : isFinishing ? (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-amber-200 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
          <span className="font-medium">Capturando e decodificando as últimas palavras do áudio...</span>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2 text-xs flex items-start gap-2">
          {isTranscribing ? (
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
          ) : transcript ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Radio className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            {isTranscribing ? (
              <>
                <span className="text-cyan-400 font-bold mr-1.5">⚡ Transcrevendo:</span>
                <span className="text-cyan-100 font-medium italic">"{transcript}"</span>
              </>
            ) : transcript ? (
              <>
                <span className="text-emerald-400 font-bold mr-1.5">✓ Pronto:</span>
                <span className="text-slate-100 font-medium italic">"{transcript}"</span>
              </>
            ) : (
              <>
                <span className="text-slate-400 font-medium mr-1.5">Ouvindo:</span>
                <span className="text-slate-500 italic">Fale sua dúvida sobre clientes, defeitos ou envio...</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
