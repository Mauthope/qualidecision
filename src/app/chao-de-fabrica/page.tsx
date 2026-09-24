'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuality } from '@/context/QualityContext';
import { storageService } from '@/services/storageService';
import { aiAssistantService } from '@/services/aiAssistantService';
import { AiChatMessage, ComplaintPhoto } from '@/types';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
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
  Hash
} from 'lucide-react';

const INITIAL_MESSAGE: AiChatMessage = {
  id: 'msg-welcome-shopfloor',
  sender: 'assistant',
  text: `👋 Olá! Sou o **Assistente de Qualidade - Chão de Fábrica** da Rafitec.\n\n` +
    `Estou conectado em tempo real à base de dados para orientar operadores de máquinas, revisores, líderes de turno e inspetores sobre **cuidados operacionais de produção** (extrusão, tecelagem, impressão, solda, costura e paletização) e **histórico de reclamações SAC** dos clientes.\n\n` +
    `💡 **Como posso orientar sua linha hoje?**\n` +
    `• Digite o nome de um cliente para ver a sequência de cuidados (Ex: *"Copacol"*, *"Bunge"*, *"Aurora"*, *"Alisul"*)\n` +
    `• Tire dúvidas sobre um tipo de defeito ou máquina (Ex: *"Como evitar problemas de solda valvulada?"* ou *"Cuidados com refilamento"*)\n` +
    `• Consulte as reclamações mais frequentes registradas pelo SAC.`,
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  suggestedPrompts: [
    'Quais os cuidados para a Copacol?',
    'Quais os cuidados para a Bunge?',
    'Quais os cuidados para a Aurora?',
    'Defeitos mais reclamados no SAC'
  ],
  source: 'gemini'
};

const TOP_CLIENTS_QUICK = [
  'Copacol',
  'Bunge',
  'Aurora',
  'Alisul',
  'JBS',
  'Yara'
];

export default function ChaoDeFabricaPage() {
  const { user, signOut } = useAuth();
  const { customers, defects, complaints } = useQuality();

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

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isTyping) return;

    const userMessage: AiChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const localGeminiKey = storageService.getGeminiApiKey();

      // Compact complaints payload for lower latency
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
        description: c.description
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
          mode: 'chao_de_fabrica',
          apiKey: localGeminiKey || undefined
        })
      });

      if (res.ok) {
        const aiResponse: AiChatMessage = await res.json();
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Fallback directly to specialized local engine
        console.warn('API /api/ai/chat returned error, fallback to local shop floor engine');
        const localResponse = aiAssistantService.processShopFloorQuery(
          text,
          newHistory,
          customers,
          defects,
          complaints
        );
        setMessages(prev => [...prev, localResponse]);
      }
    } catch (err: any) {
      console.warn('Network error, fallback to local shop floor engine:', err);
      const localResponse = aiAssistantService.processShopFloorQuery(
        text,
        newHistory,
        customers,
        defects,
        complaints
      );
      setMessages(prev => [...prev, localResponse]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputPrompt, isTyping, messages, customers, defects, complaints]);

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    try {
      sessionStorage.removeItem('rafitec_shopfloor_chat');
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#060a13] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 overflow-hidden font-sans">
      
      {/* Top Header - Dedicated Shop Floor Terminal */}
      <header className="shrink-0 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shadow-lg shadow-black/40 z-20">
        
        {/* Brand & Identification */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-cyan-500 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Factory className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white font-heading">
                Rafitec • Terminal Chão de Fábrica
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 uppercase tracking-wider hidden sm:inline-block">
                Modo Operacional
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Orientações Técnicas & Prevenção SAC</span>
            </p>
          </div>
        </div>

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-slate-200">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Operador'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {user?.email}
            </span>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 transition-all text-xs font-medium cursor-pointer"
            title="Sair do terminal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Quick Customer Pill Bar */}
      <div className="shrink-0 bg-slate-950/70 border-b border-slate-800/80 px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-10">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          Clientes Rápidos:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {TOP_CLIENTS_QUICK.map(clientName => (
            <button
              key={clientName}
              type="button"
              onClick={() => handleSendMessage(`Quais os cuidados para o cliente ${clientName}?`)}
              disabled={isTyping}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              {clientName}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleSendMessage('Quais são os defeitos mais reclamados no SAC?')}
            disabled={isTyping}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer ml-1"
          >
            ⚠️ Top Defeitos SAC
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-2.5 sm:gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-cyan-600/20'
                      : 'bg-slate-900 border border-slate-800 text-amber-400 shadow-black/40'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Container */}
                <div className={`flex-1 max-w-[92%] sm:max-w-[85%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-tr-none ml-auto'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line space-y-1">
                      {msg.text.split('\n').map((line, lIdx) => {
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
                        const isNumbered = /^\d+\.\s/.test(line.trim());

                        return (
                          <p
                            key={lIdx}
                            className={`${isBullet ? 'ml-3 my-0.5' : isNumbered ? 'ml-1 my-1' : 'my-0.5'}`}
                          >
                            {parts.map((part, pIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={pIdx} className="font-bold text-cyan-200">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>

                    {/* Metadata footer */}
                    <div className={`text-[10px] mt-2 flex items-center justify-between font-mono ${isUser ? 'text-cyan-100/70' : 'text-slate-500'}`}>
                      {!isUser && (
                        <span className="flex items-center gap-1.5">
                          {msg.source === 'gemini' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              <Sparkles className="w-2.5 h-2.5" />
                              IA Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Base Qualidecision
                            </span>
                          )}
                        </span>
                      )}
                      <span className={isUser ? 'ml-auto' : ''}>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Customer Card Attached */}
                  {msg.customerCard && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                          {msg.customerCard.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{msg.customerCard.name}</span>
                            {msg.customerCard.code && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">
                                {msg.customerCard.code}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Segmento: {msg.customerCard.segment || 'Geral'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
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
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        Evidências e Laudos Fotográficos do SAC ({msg.complaintCards.length}):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.complaintCards.map(complaint => (
                          <div
                            key={complaint.id}
                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                              <span className="font-mono font-bold text-rose-400">
                                {complaint.code}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(complaint.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div className="text-xs text-white font-semibold">
                              {complaint.defectTypeName}
                            </div>

                            {complaint.description && (
                              <p className="text-[11px] text-slate-300 italic bg-black/40 p-2 rounded border border-slate-800/80">
                                "{complaint.description}"
                              </p>
                            )}

                            {/* Photos */}
                            {complaint.photos && complaint.photos.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {complaint.photos.map(photo => (
                                  <div
                                    key={photo.id}
                                    onClick={() => {
                                      setActivePhoto(photo);
                                      setActivePhotoTitle(`${complaint.customerName} - ${complaint.defectTypeName}`);
                                    }}
                                    className="relative group cursor-pointer w-20 h-16 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                      <Eye className="w-4 h-4 text-cyan-300" />
                                    </div>
                                  </div>
                                ))}
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
                      <span className="text-[10px] text-slate-500 font-medium mr-1">Sugestões:</span>
                      {msg.suggestedPrompts.map((sp, spIdx) => (
                        <button
                          key={spIdx}
                          type="button"
                          onClick={() => handleSendMessage(sp)}
                          disabled={isTyping}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
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
            <div className="flex gap-2.5 items-center text-slate-400 text-xs bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 w-fit animate-pulse">
              <Bot className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Consultando especificações técnicas e histórico SAC...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Toolbar Fixed Bottom */}
      <footer className="shrink-0 bg-slate-950/95 border-t border-slate-800/90 p-3 sm:p-4 z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Digite o nome do cliente ou o defeito para ver os cuidados na máquina..."
                disabled={isTyping}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              className="px-4 sm:px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-cyan-400 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer active:scale-95 shrink-0"
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
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Limpar histórico da conversa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="hidden sm:inline">
              Terminal exclusivo de chão de fábrica: orientações técnicas de produção e SAC.
            </span>
            <span className="text-[10px] text-slate-500 ml-auto">
              Rafitec S/A • QualiDecision Industrial
            </span>
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
