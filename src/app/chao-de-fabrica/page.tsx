'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuality } from '@/context/QualityContext';
import { storageService } from '@/services/storageService';
import { aiAssistantService } from '@/services/aiAssistantService';
import { AiChatMessage, ComplaintPhoto } from '@/types';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { RichChatMessage } from '@/components/chat/RichChatMessage';
import {
  Factory,
  ShieldCheck,
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Camera,
  Eye,
  LogOut,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Building2,
  HelpCircle,
  Hash,
  Layers,
  ChevronRight,
  Mic
} from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { VoiceMessageBubble } from '@/components/chat/VoiceMessageBubble';
import { VoiceRecordingBar } from '@/components/chat/VoiceRecordingBar';
import { TtsSpeakerButton } from '@/components/chat/TtsSpeakerButton';

const INITIAL_MESSAGE: AiChatMessage = {
  id: 'msg-welcome-shopfloor',
  sender: 'assistant',
  text: `👋 Olá! Sou o **Sensei**, seu especialista em Qualidade e Prevenção Operacional no Chão de Fábrica da Rafitec (*Desenvolvido por Mauricio Grigol*).\n\n` +
    `Estou conectado em tempo real à base de dados para orientar operadores de máquinas, revisores, líderes de turno e inspetores sobre **cuidados operacionais de produção** (extrusão, tecelagem, laminação, impressão, corte, costura, solda valvulada e paletização) e **histórico de reclamações SAC** dos clientes.\n\n` +
    `💡 **Como posso orientar sua linha hoje?**\n` +
    `• Digite o nome de um cliente para ver a sequência cirúrgica de cuidados (Ex: *"Aurora"*, *"Copacol"*, *"Bunge"*, *"Alisul"*)\n` +
    `• Tire dúvidas sobre um tipo de defeito ou máquina (Ex: *"Como evitar problemas de linner ou solda?"* ou *"Cuidados no corte e refilamento"*)\n` +
    `• Consulte as reclamações mais frequentes registradas pelo SAC.`,
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  suggestedPrompts: [
    'Quais os cuidados para o cliente Aurora?',
    'Quais os cuidados para a Copacol?',
    'Quais os cuidados para a Bunge?',
    'Defeitos mais reclamados no SAC'
  ],
  source: 'gemini'
};

const TOP_CLIENTS_QUICK = [
  'Aurora',
  'Copacol',
  'Bunge',
  'Alisul',
  'JBS',
  'Yara'
];

export default function ChaoDeFabricaPage() {
  const { user, signOut } = useAuth();
  const { customers, defects, complaints, concessions } = useQuality();

  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('rafitec_shopfloor_chat');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [INITIAL_MESSAGE];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [activePhotoTitle, setActivePhotoTitle] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Persist messages in session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('rafitec_shopfloor_chat', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const {
    isRecording,
    isFinishing: isVoiceFinishing,
    isTranscribing: isVoiceTranscribing,
    transcript: recordingTranscript,
    duration: recordingDuration,
    audioLevel: recordingAudioLevel,
    error: recordingError,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecording();

  const handleStartVoice = async () => {
    await startRecording();
  };

  const handleCancelVoice = () => {
    cancelRecording();
  };

  const handleSendMessage = useCallback(async (
    textToSend?: string,
    voiceData?: { audioUrl?: string; audioDuration?: number; isVoiceMessage?: boolean }
  ) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isTyping) return;

    const userMessage: AiChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isVoiceMessage: voiceData?.isVoiceMessage,
      audioUrl: voiceData?.audioUrl,
      audioDuration: voiceData?.audioDuration
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const localGeminiKey = storageService.getGeminiApiKey();

      // Complaints payload with photos preserved for evidence visualization
      const lightComplaints = complaints.map(c => ({
        id: c.id,
        code: c.code,
        customerId: c.customerId,
        customerName: c.customerName,
        customerNumber: c.customerNumber,
        defectTypeId: c.defectTypeId,
        defectTypeName: c.defectTypeName,
        date: c.date,
        severity: c.severity,
        quantityAffected: c.quantityAffected,
        status: c.status,
        description: c.description,
        rootCause: c.rootCause,
        correctiveAction: c.correctiveAction,
        opNumber: c.opNumber || (c as any).op_number || c.lotNumber,
        photos: (c.photos || []).map(p => ({
          id: p.id,
          caption: p.caption,
          defectLocation: p.defectLocation,
          url: p.url && !p.url.startsWith('data:') ? p.url : ''
        }))
      }));

      // Concessions payload for operational glimpse
      const lightConcessions = concessions.map(c => ({
        id: c.id,
        code: c.code,
        customerId: c.customerId,
        customerName: c.customerName,
        customerNumber: c.customerNumber,
        opNumber: c.opNumber || (c as any).op_number || c.lotNumber,
        defectTypeName: c.defectTypeName,
        severity: c.severity,
        quantity: c.quantity,
        date: c.date,
        customerFeedbackStatus: c.customerFeedbackStatus,
        technicalNotes: c.technicalNotes,
        photos: (c.photos || []).map(p => ({
          id: p.id,
          caption: p.caption,
          defectLocation: p.defectLocation,
          url: p.url && !p.url.startsWith('data:') ? p.url : ''
        }))
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: newHistory.slice(-6),
          customers,
          defects,
          complaints: lightComplaints,
          concessions: lightConcessions,
          mode: 'chao_de_fabrica',
          apiKey: localGeminiKey || undefined
        })
      });

      if (res.ok) {
        const aiResponse: AiChatMessage = await res.json();

        // Re-hidrata os cards de evidências com as fotos completas (incluindo base64) do estado local
        if (aiResponse.complaintCards && aiResponse.complaintCards.length > 0) {
          aiResponse.complaintCards = aiResponse.complaintCards.map(cc => {
            const fullComp = complaints.find(comp => comp.id === cc.id);
            return fullComp && fullComp.photos && fullComp.photos.length > 0 ? { ...cc, photos: fullComp.photos } : cc;
          });
        }
        if (aiResponse.referenceComplaintCards && aiResponse.referenceComplaintCards.length > 0) {
          aiResponse.referenceComplaintCards = aiResponse.referenceComplaintCards.map(cc => {
            const fullComp = complaints.find(comp => comp.id === cc.id);
            return fullComp && fullComp.photos && fullComp.photos.length > 0 ? { ...cc, photos: fullComp.photos } : cc;
          });
        }
        if (aiResponse.concessionCards && aiResponse.concessionCards.length > 0) {
          aiResponse.concessionCards = aiResponse.concessionCards.map(cc => {
            const fullConc = concessions.find(conc => conc.id === cc.id);
            return fullConc && fullConc.photos && fullConc.photos.length > 0 ? { ...cc, photos: fullConc.photos } : cc;
          });
        }

        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Fallback directly to specialized local Sensei engine
        console.warn('API /api/ai/chat returned error, fallback to local Sensei engine');
        const localResponse = aiAssistantService.processShopFloorQuery(
          text,
          newHistory,
          customers,
          defects,
          complaints,
          concessions
        );
        setMessages(prev => [...prev, localResponse]);
      }
    } catch (err: any) {
      console.warn('Network error, fallback to local Sensei engine:', err);
      const localResponse = aiAssistantService.processShopFloorQuery(
        text,
        newHistory,
        customers,
        defects,
        complaints,
        concessions
      );
      setMessages(prev => [...prev, localResponse]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputPrompt, isTyping, messages, customers, defects, complaints, concessions]);

  const [localVoiceError, setLocalVoiceError] = useState<string | null>(null);

  const handleStopVoiceToReview = async () => {
    const res = await stopRecording();
    if (res.transcript) {
      setInputPrompt(res.transcript);
      setLocalVoiceError(null);
    } else {
      setLocalVoiceError('Nenhuma fala foi detectada para preencher.');
    }
  };

  const handleSendVoice = async () => {
    setLocalVoiceError(null);
    const res = await stopRecording();
    const query = res.transcript.trim();
    if (!query) {
      setLocalVoiceError('Nenhuma fala detectada. Aproxime o microfone e fale claramente antes de enviar.');
      return;
    }
    await handleSendMessage(query, {
      audioUrl: res.audioUrl || undefined,
      audioDuration: res.duration,
      isVoiceMessage: true
    });
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    try {
      sessionStorage.removeItem('rafitec_shopfloor_chat');
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#060a13] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 overflow-hidden font-sans">
      
      {/* Top Header - Dedicated Sensei Shop Floor Terminal */}
      <header className="shrink-0 h-16 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shadow-lg shadow-black/40 z-20">
        
        {/* Brand & Identification */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-heading">
                Sensei • Chão de Fábrica
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 uppercase tracking-wider hidden sm:inline-block">
                IA Sensei • Modo Operacional
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Orientações Técnicas & Prevenção SAC</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-cyan-400/90 font-medium hidden sm:inline">Desenvolvido por Mauricio Grigol</span>
            </p>
          </div>
        </div>

        {/* Right Info: PWA Install Button, Status Dot & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <PwaInstallButton label="Instalar no Aparelho" />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">Sensei Conectado</span>
          </div>

          <div className="hidden md:flex flex-col items-end text-right border-l border-slate-800/80 pl-3">
            <span className="text-xs font-semibold text-slate-200">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Operador'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {user?.email}
            </span>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 transition-all text-xs font-medium cursor-pointer shadow-sm"
            title="Sair do terminal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Quick Customer Pill Bar */}
      <div className="shrink-0 bg-slate-950/60 border-b border-slate-800/70 px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-10">
        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          Clientes Rápidos:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {TOP_CLIENTS_QUICK.map(clientName => (
            <button
              key={clientName}
              type="button"
              onClick={() => handleSendMessage(`Quais os cuidados para o cliente ${clientName}?`)}
              disabled={isTyping}
              className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {clientName}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleSendMessage('Quais são os defeitos mais reclamados no SAC?')}
            disabled={isTyping}
            className="px-3 py-1 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer ml-1"
          >
            ⚠️ Top Defeitos SAC
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    isUser
                      ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-cyan-600/10'
                      : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />}
                </div>

                {/* Message Container */}
                <div className={`flex-1 max-w-[92%] sm:max-w-[85%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Bubble */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xl ${
                      isUser
                        ? msg.isVoiceMessage
                          ? 'bg-slate-900/95 border border-cyan-500/40 text-white rounded-tr-none ml-auto max-w-md p-3 sm:p-4'
                          : 'bg-cyan-600 text-white rounded-tr-none ml-auto max-w-2xl'
                        : 'glow-card rounded-tl-none border border-slate-800/80 text-slate-100'
                    }`}
                  >
                    {isUser && msg.isVoiceMessage ? (
                      <VoiceMessageBubble
                        audioUrl={msg.audioUrl}
                        audioDuration={msg.audioDuration}
                        text={msg.text}
                        timestamp={msg.timestamp}
                      />
                    ) : (
                      <>
                        <RichChatMessage text={msg.text} isUser={isUser} />

                        {/* Metadata footer */}
                        <div className={`text-[10px] mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between font-mono ${isUser ? 'text-cyan-100/70 border-cyan-500/30' : 'text-slate-500'}`}>
                          {!isUser && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5">
                                {msg.source === 'gemini' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Sensei Ativo • IA Gemini
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Sensei Ativo • Base Qualidecision
                                  </span>
                                )}
                              </span>
                              <TtsSpeakerButton text={msg.text} />
                            </div>
                          )}
                          <span className={isUser ? 'ml-auto' : ''}>{msg.timestamp}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Customer Card Attached */}
                  {msg.customerCard && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-cyan-500/20 shrink-0">
                          {msg.customerCard.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-heading">{msg.customerCard.name}</span>
                            {msg.customerCard.code && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-cyan-300 rounded-md border border-slate-700">
                                {msg.customerCard.code}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Segmento: {msg.customerCard.segment || 'Geral'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          msg.customerCard.overallToleranceScore <= 60
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : msg.customerCard.overallToleranceScore <= 75
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {msg.customerCard.overallToleranceScore <= 60
                            ? '⭐ Ranking A (Crítico)'
                            : msg.customerCard.overallToleranceScore <= 75
                            ? '🥈 Ranking B'
                            : '🥉 Ranking C'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Attached SAC Complaint Cards (Photos and Details) */}
                  {msg.complaintCards && msg.complaintCards.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-rose-400" />
                        Evidências e Laudos Fotográficos do SAC ({msg.complaintCards.length}):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.complaintCards.map(complaint => (
                          <div
                            key={complaint.id}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-md"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                              <span className="font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                                {complaint.code}
                              </span>
                              {complaint.opNumber && (
                                <span className="text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                                  OP: {complaint.opNumber}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {new Date(complaint.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div className="text-xs text-white font-bold flex items-center justify-between">
                              <span>{complaint.defectTypeName}</span>
                              <span className="text-[10px] font-semibold text-rose-300 uppercase px-1.5 py-0.5 rounded bg-rose-500/15">
                                {complaint.severity}
                              </span>
                            </div>

                            {complaint.description && (
                              <p className="text-[11px] text-slate-300 italic bg-black/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                                "{complaint.description}"
                              </p>
                            )}

                            {/* Photos Gallery */}
                            {complaint.photos && complaint.photos.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-cyan-400" />
                                  Clique na foto para ampliar em tela cheia:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {complaint.photos.map(photo => (
                                    <div
                                      key={photo.id}
                                      onClick={() => {
                                        setActivePhoto(photo);
                                        const opText = complaint.opNumber ? ` (OP ${complaint.opNumber})` : '';
                                        setActivePhotoTitle(`${complaint.customerName} - [${complaint.code}] ${complaint.defectTypeName}${opText}`);
                                      }}
                                      className="relative group cursor-pointer w-28 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all shadow-md bg-black"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.caption || 'Foto da não conformidade'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <Eye className="w-5 h-5 text-cyan-300" />
                                      </div>
                                      {photo.caption && (
                                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1.5 py-0.5 text-[9px] text-slate-200 truncate">
                                          {photo.caption}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reference SAC Complaint Cards (Exemplos Visuais de Outros Clientes) */}
                  {msg.referenceComplaintCards && msg.referenceComplaintCards.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-bold text-amber-300 flex items-center gap-2">
                            <span>Amostras de Referência Técnica (Defeito Semelhante)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono font-bold tracking-wider">
                              Ilustrativo
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed">
                            Por <strong>não haver fotos registradas</strong> no histórico deste cliente para o problema relatado, estamos apresentando abaixo evidências fotográficas de <strong>problemas semelhantes registrados em outros clientes</strong> para apoio e conferência visual na bancada.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.referenceComplaintCards.map(complaint => (
                          <div
                            key={complaint.id}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-2.5 shadow-md relative"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                              <span className="font-mono text-[10px] uppercase font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
                                Referência Visual
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Origem: {complaint.customerName}
                              </span>
                            </div>

                            <div className="text-xs text-white font-bold flex items-center justify-between">
                              <span>{complaint.defectTypeName}</span>
                              <span className="text-[10px] font-semibold text-amber-300 uppercase px-1.5 py-0.5 rounded bg-amber-500/15">
                                {complaint.severity}
                              </span>
                            </div>

                            {complaint.description && (
                              <p className="text-[11px] text-slate-300 italic bg-black/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                                "{complaint.description}"
                              </p>
                            )}

                            {/* Photos Gallery */}
                            {complaint.photos && complaint.photos.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[10px] text-amber-300/80 font-semibold flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-amber-400" />
                                  Foto do defeito similar (toque para ampliar):
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {complaint.photos.map(photo => (
                                    <div
                                      key={photo.id}
                                      onClick={() => {
                                        setActivePhoto(photo);
                                        setActivePhotoTitle(`[REFERÊNCIA VISUAL] ${complaint.defectTypeName} (Origem: ${complaint.customerName})`);
                                      }}
                                      className="relative group cursor-pointer w-28 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden border border-amber-500/40 hover:border-amber-400 transition-all shadow-md bg-black"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.caption || 'Foto de referência'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <Eye className="w-5 h-5 text-amber-300" />
                                      </div>
                                      {photo.caption && (
                                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1.5 py-0.5 text-[9px] text-slate-200 truncate">
                                          {photo.caption}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attached Concession Cards (Photos and Details from Shop Floor) */}
                  {msg.concessionCards && msg.concessionCards.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        Evidências Fotográficas e Registros de Inspeção / Concessão ({msg.concessionCards.length}):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.concessionCards.map(concession => (
                          <div
                            key={concession.id}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-md"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                              <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                {concession.code}
                              </span>
                              {concession.opNumber && (
                                <span className="text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                                  OP: {concession.opNumber}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {new Date(concession.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div className="text-xs text-white font-bold flex items-center justify-between">
                              <span>{concession.defectTypeName}</span>
                              <span className="text-[10px] font-semibold text-emerald-300 uppercase px-1.5 py-0.5 rounded bg-emerald-500/15">
                                {concession.customerFeedbackStatus === 'aceito_sem_ressalvas'
                                  ? 'Aceito sem Ressalvas'
                                  : concession.customerFeedbackStatus === 'aceito_com_observacao'
                                  ? 'Aceito com Observação'
                                  : 'Concessão Aprovada'}
                              </span>
                            </div>

                            {concession.technicalNotes && (
                              <p className="text-[11px] text-slate-300 italic bg-black/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                                "{concession.technicalNotes}"
                              </p>
                            )}

                            {/* Photos Gallery */}
                            {concession.photos && concession.photos.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-cyan-400" />
                                  Clique na foto para ampliar em tela cheia:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {concession.photos.map(photo => (
                                    <div
                                      key={photo.id}
                                      onClick={() => {
                                        setActivePhoto(photo);
                                        const opText = concession.opNumber ? ` (OP ${concession.opNumber})` : '';
                                        setActivePhotoTitle(`${concession.customerName} - [${concession.code}] ${concession.defectTypeName}${opText}`);
                                      }}
                                      className="relative group cursor-pointer w-28 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all shadow-md bg-black"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.caption || 'Foto da concessão'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <Eye className="w-5 h-5 text-cyan-300" />
                                      </div>
                                      {photo.caption && (
                                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1.5 py-0.5 text-[9px] text-slate-200 truncate">
                                          {photo.caption}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Suggested Chips */}
                  {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 font-medium mr-1">Sugestões do Sensei:</span>
                      {msg.suggestedPrompts.map((sp, spIdx) => (
                        <button
                          key={spIdx}
                          type="button"
                          onClick={() => handleSendMessage(sp)}
                          disabled={isTyping}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 items-center text-slate-300 text-xs bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 w-fit animate-pulse shadow-md">
              <Bot className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Sensei consultando base técnica, laudos de SAC e especificações...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Toolbar Fixed Bottom */}
      <footer className="shrink-0 bg-slate-950/85 backdrop-blur-xl border-t border-slate-800/80 p-3 sm:p-4 z-20 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          
          {/* Recording Error Alert Banner if any */}
          {(recordingError || localVoiceError) && (
            <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl flex items-center justify-between text-xs text-amber-200 animate-in fade-in">
              <span>{recordingError || localVoiceError}</span>
              <button
                type="button"
                onClick={() => {
                  setLocalVoiceError(null);
                  handleCancelVoice();
                }}
                className="text-amber-400 hover:text-white font-bold ml-2 underline cursor-pointer"
              >
                OK
              </button>
            </div>
          )}

          {isRecording ? (
            <VoiceRecordingBar
              duration={recordingDuration}
              transcript={recordingTranscript}
              audioLevel={recordingAudioLevel}
              error={recordingError || localVoiceError}
              isFinishing={isVoiceFinishing}
              isTranscribing={isVoiceTranscribing}
              onCancel={() => {
                setLocalVoiceError(null);
                handleCancelVoice();
              }}
              onSend={handleSendVoice}
              onStop={handleStopVoiceToReview}
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={isTyping}
                className="p-3.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/50 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm group active:scale-95 disabled:opacity-40"
                title="Gravar mensagem de voz (Falar ao invés de digitar)"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </button>

              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Pergunte ao Sensei (Ex: 'Quais os cuidados para o cliente Aurora?')..."
                  disabled={isTyping}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isTyping}
                className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95 shrink-0"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                disabled={messages.length <= 1 || isTyping}
                className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
                title="Reiniciar conversa e limpar histórico"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 px-1 gap-1">
            <span className="hidden sm:inline">
              Sensei • Terminal exclusivo de chão de fábrica: orientações técnicas de produção e prevenção de SAC.
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium sm:ml-auto">
              <span className="text-cyan-400 font-semibold">Desenvolvido por Mauricio Grigol</span>
              <span className="text-slate-600">•</span>
              <span>Rafitec S/A</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Photo Viewer Modal */}
      {activePhoto && (
        <PhotoViewerModal
          photo={activePhoto}
          title={activePhotoTitle}
          onClose={() => setActivePhoto(null)}
        />
      )}

    </div>
  );
}
