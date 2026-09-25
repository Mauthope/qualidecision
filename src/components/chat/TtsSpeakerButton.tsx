'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface TtsSpeakerButtonProps {
  text: string;
}

export const TtsSpeakerButton: React.FC<TtsSpeakerButtonProps> = ({ text }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^#{1,6}\s+/gm, '') // Remove headings
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code inline
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/[•*\-]\s+/g, '') // Remove list bullets
      .replace(/SUGESTOES:[\s\S]*$/, '') // Remove suggestions at end
      .replace(/https?:\/\/\S+/g, '') // Remove URLs
      .replace(/[\r\n]+/g, '. ') // Normalize line breaks to pauses
      .replace(/\.{2,}/g, '.')
      .trim();
  };

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleToggle = () => {
    if (!isSupported) return;

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // Slightly faster for natural listening
    utterance.pitch = 1.0;

    // Pick best available pt-BR voice if present
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-sm ${
        isSpeaking
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
          : 'bg-slate-900/90 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800'
      }`}
      title={isSpeaking ? 'Parar leitura de áudio' : 'Ouvir resposta em voz alta'}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          <span>Parar Áudio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ouvir</span>
        </>
      )}
    </button>
  );
};
