'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

interface VoiceMessageBubbleProps {
  audioUrl?: string;
  audioDuration?: number;
  text: string;
  timestamp: string;
  isUser?: boolean;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  audioUrl,
  audioDuration,
  text,
  timestamp,
  isUser = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Soundwave decorative bars
  const waveHeights = [24, 40, 65, 80, 45, 90, 70, 50, 85, 95, 60, 40, 75, 55, 30, 60, 85, 45];

  return (
    <div className="flex flex-col gap-2 max-w-sm sm:max-w-md w-full">
      {/* Audio Player Card */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 shadow-inner">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={!audioUrl}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          title={isPlaying ? 'Pausar áudio' : 'Ouvir mensagem de voz'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          )}
        </button>

        {/* Waveform and Progress Bar */}
        <div className="flex-1 space-y-1.5 cursor-pointer" onClick={handleSeek}>
          <div className="flex items-center gap-1 h-7">
            {waveHeights.map((h, i) => {
              const barPct = (i / waveHeights.length) * 100;
              const isPassed = barPct <= progressPct;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: `${isPlaying ? Math.max(20, Math.min(100, h * (0.6 + Math.random() * 0.8))) : h}%`,
                    backgroundColor: isPassed ? '#22d3ee' : '#334155'
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-cyan-300 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Mic className="w-3 h-3 text-cyan-400" />
              {formatTime(duration || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Transcription Preview */}
      {text && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
            Transcrição da voz:
          </div>
          <p className="italic text-slate-100">"{text}"</p>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-[10px] text-slate-400 text-right pr-1">
        {timestamp}
      </div>
    </div>
  );
};
