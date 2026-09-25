'use client';

import React from 'react';
import { Mic, Trash2, Send, StopCircle, Radio } from 'lucide-react';

interface VoiceRecordingBarProps {
  duration: number;
  transcript: string;
  audioLevel: number; // 0 to 100
  onCancel: () => void;
  onSend: () => void;
  onStop?: () => void;
}

export const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  duration,
  transcript,
  audioLevel,
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
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute" />
            <span className="w-3 h-3 rounded-full bg-rose-500 relative" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider hidden sm:inline">
              Gravando Áudio
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
              className="flex-1 rounded-full bg-gradient-to-t from-cyan-500 to-teal-300 transition-all duration-75"
              style={{
                height: `${h}%`,
                opacity: audioLevel > 5 ? 1 : 0.4
              }}
            />
          ))}
        </div>

        {/* Action Controls: Cancel, Stop, Send */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition-all cursor-pointer shadow-sm"
            title="Descartar gravação de áudio"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onStop && (
            <button
              type="button"
              onClick={onStop}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-sm hidden sm:flex"
              title="Parar e revisar transcrição"
            >
              <StopCircle className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            type="button"
            onClick={onSend}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 hover:from-cyan-400 hover:to-teal-300 transition-all shadow-md shadow-cyan-500/25 cursor-pointer active:scale-95"
            title="Enviar mensagem de voz"
          >
            <Send className="w-4 h-4 fill-slate-950" />
            <span className="hidden sm:inline">Enviar Voz</span>
          </button>
        </div>
      </div>

      {/* Live speech recognition transcription preview */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2 text-xs flex items-start gap-2">
        <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1 min-w-0">
          <span className="text-slate-400 font-medium mr-1.5">Ouvindo:</span>
          {transcript ? (
            <span className="text-cyan-200 font-medium italic">"{transcript}"</span>
          ) : (
            <span className="text-slate-500 italic">Fale sua dúvida sobre clientes, defeitos ou envio...</span>
          )}
        </div>
      </div>
    </div>
  );
};
