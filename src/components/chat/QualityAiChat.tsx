'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuality } from '@/context/QualityContext';
import { ComplaintPhoto, Complaint, ConcessionShipment } from '@/types';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Camera,
  MapPin,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface Props {
  isDrawer?: boolean;
}

const QUICK_PROMPTS = [
  'Quais foram as reclamações do cliente Alisul?',
  'Posso enviar 10.000 sacos com vinco para a Alisul?',
  'Qual o perfil de tolerância da Copacol?',
  'Podemos mandar Big Bag com borrão para a Bunge?',
  'Quanto de scrap/refugo foi evitado este mês?',
  'JBS aceita sacaria com mancha de óleo?'
];

export const QualityAiChat: React.FC<Props> = ({ isDrawer = false }) => {
  const { chatMessages, sendAiMessage } = useQuality();
  const [inputPrompt, setInputPrompt] = useState('');
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [activePhotoTitle, setActivePhotoTitle] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;
    sendAiMessage(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendAiMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 flex-1 overflow-hidden">
      
      {/* Quick Prompt Chips */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto custom-scrollbar flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5" />
          Sugestões rápidas:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(prompt)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 transition-all shrink-0 whitespace-nowrap cursor-pointer shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 custom-scrollbar">
        {chatMessages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-5xl mx-auto`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isUser
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20'
              }`}>
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-[92%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none ml-auto max-w-2xl'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.text.split('\n').map((line, lIdx) => {
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={lIdx} className={line.startsWith('•') ? 'ml-3 my-1' : 'my-1.5'}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="font-bold text-cyan-200">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  <div className={`text-[11px] mt-2 text-right font-mono ${isUser ? 'text-cyan-100/70' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* Attached Complaint Cards with Photos (Tela Cheia Grid) */}
                {msg.complaintCards && msg.complaintCards.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-rose-400" />
                      Evidências e Laudos Fotográficos do ERP ({msg.complaintCards.length}):
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                      {msg.complaintCards.map(complaint => (
                        <div
                          key={complaint.id}
                          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                                {complaint.code}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                Lote: <strong className="font-mono text-cyan-300">{complaint.lotNumber}</strong>
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(complaint.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="text-xs text-slate-200 font-bold flex items-center justify-between">
                            <span>{complaint.defectTypeName}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase font-semibold">
                              Gravidade {complaint.severity}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 italic bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                            "{complaint.description}"
                          </p>

                          {/* Photos Grid Fullscreen */}
                          {complaint.photos && complaint.photos.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                Clique para ampliar em alta resolução:
                              </div>

                              <div className="flex flex-wrap gap-2.5">
                                {complaint.photos.map(photo => (
                                  <div
                                    key={photo.id}
                                    onClick={() => {
                                      setActivePhoto(photo);
                                      setActivePhotoTitle(`${complaint.customerName} - [${complaint.code}] Lote ${complaint.lotNumber}`);
                                    }}
                                    className="relative group cursor-pointer w-32 sm:w-40 h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-700 bg-black hover:border-cyan-400 transition-all shadow-md"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                      <Eye className="w-5 h-5 text-cyan-300" />
                                    </div>
                                    {photo.defectLocation && (
                                      <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1 text-[10px] text-cyan-300 font-medium truncate px-2">
                                        {photo.defectLocation}
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

                {/* Attached Concession Cards */}
                {msg.concessionCards && msg.concessionCards.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Lotes Expedidos com Concessão Registrada:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {msg.concessionCards.map(c => (
                        <div key={c.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex flex-col justify-between space-y-2">
                          <div>
                            <div className="font-bold text-slate-200">{c.customerName}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Lote {c.lotNumber} • {c.defectTypeName} ({c.quantity.toLocaleString('pt-BR')} un)
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-emerald-400 font-semibold">Refugo Evitado:</span>
                            <span className="font-mono font-bold text-cyan-400 text-sm">
                              R$ {c.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Fullscreen */}
      <form onSubmit={handleSend} className="p-3.5 sm:p-5 border-t border-slate-800/80 bg-slate-900/70 flex items-center gap-3">
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          placeholder="Digite sua dúvida (ex: Quais foram as reclamações da Alisul? / Posso enviar 5 mil sacos com vinco?)..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim()}
          className="px-5 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold hover:from-cyan-400 hover:to-teal-400 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/25 shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Consultar</span>
        </button>
      </form>

      {/* Photo Viewer Zoom Modal */}
      {activePhoto && (
        <PhotoViewerModal
          photo={activePhoto}
          title={activePhotoTitle}
          onClose={() => setActivePhoto(null)}
        />
      )}
    </div>
  );
};
