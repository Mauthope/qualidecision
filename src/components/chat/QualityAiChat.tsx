'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuality } from '@/context/QualityContext';
import { ComplaintPhoto, DefectSeverity } from '@/types';
import { PhotoViewerModal } from '@/components/reclamacoes/PhotoViewerModal';
import { NewConcessionModal } from '@/components/envios/NewConcessionModal';
import { RichChatMessage } from './RichChatMessage';
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
  TrendingUp,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Key,
  Database,
  Loader2
} from 'lucide-react';
import { storageService } from '@/services/storageService';

interface Props {
  isDrawer?: boolean;
}

const QUICK_PROMPTS = [
  'Resumo do que foi enviado este ano',
  'Resumo das reclamações de clientes',
  'Posso enviar 10.000 sacos com vinco para a Copacol?',
  'Qual o perfil de tolerância da Alisul?',
  'Quanto de scrap/refugo foi evitado no total?',
  'Quais clientes aceitam falha de solda?'
];

export const QualityAiChat: React.FC<Props> = ({ isDrawer = false }) => {
  const {
    chatMessages,
    sendAiMessage,
    isAiTyping,
    clearChatHistory
  } = useQuality();

  const [inputPrompt, setInputPrompt] = useState('');
  const [activePhoto, setActivePhoto] = useState<ComplaintPhoto | null>(null);
  const [activePhotoTitle, setActivePhotoTitle] = useState<string>('');
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [testKeyStatus, setTestKeyStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testKeyMessage, setTestKeyMessage] = useState<string>('');
  const [testKeyDetails, setTestKeyDetails] = useState<{
    status?: number;
    model?: string;
    keyPrefix?: string;
    source?: string;
    reply?: string;
  } | null>(null);
  const [connectionCheck, setConnectionCheck] = useState<'testing' | 'connected' | 'disconnected'>('testing');
  const [connectedModelName, setConnectedModelName] = useState<string>('');
  const [concessionInitialData, setConcessionInitialData] = useState<{
    customerId?: string;
    defectTypeId?: string;
    quantity?: number;
    severity?: DefectSeverity;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkLiveConnection = useCallback(async () => {
    try {
      const key = storageService.getGeminiApiKey();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          apiKey: key || undefined
        })
      });
      const data = await res.json();
      if (data.ok) {
        setConnectionCheck('connected');
        setConnectedModelName(data.model || 'Gemini 1.5');
        setHasApiKey(true);
      } else {
        setConnectionCheck('disconnected');
      }
    } catch {
      setConnectionCheck('disconnected');
    }
  }, []);

  useEffect(() => {
    const key = storageService.getGeminiApiKey();
    setHasApiKey(Boolean(key && key.trim().length > 5));
    if (key) setApiKeyInput(key);
    checkLiveConnection();
  }, [checkLiveConnection]);

  const handleTestConnection = async () => {
    setTestKeyStatus('testing');
    setTestKeyMessage('');
    setTestKeyDetails(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          apiKey: apiKeyInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.ok) {
        setTestKeyStatus('success');
        setTestKeyMessage(data.reply || 'Conexão OK');
        setTestKeyDetails(data);
        if (apiKeyInput.trim()) {
          storageService.saveGeminiApiKey(apiKeyInput.trim());
          setHasApiKey(true);
        }
        setConnectionCheck('connected');
        setConnectedModelName(data.model || 'Gemini 1.5');
      } else {
        setTestKeyStatus('error');
        setTestKeyMessage(data.error || `Erro de resposta HTTP ${data.status || res.status}`);
        setTestKeyDetails(data);
      }
    } catch (err: any) {
      setTestKeyStatus('error');
      setTestKeyMessage(err.message || 'Falha de comunicação com o servidor.');
      setTestKeyDetails(null);
    }
  };

  const handleSaveApiKey = () => {
    storageService.saveGeminiApiKey(apiKeyInput);
    setHasApiKey(Boolean(apiKeyInput && apiKeyInput.trim().length > 5));
    setIsKeyModalOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAiTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isAiTyping) return;
    sendAiMessage(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isAiTyping) return;
    sendAiMessage(prompt);
  };

  const handleActionButton = (action: any) => {
    if (action.type === 'open_concession') {
      setConcessionInitialData(action.payload || null);
      setIsConcessionModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 flex-1 overflow-hidden">
      
      {/* Top Controls: Quick Prompts & Reset Conversation */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1 py-1">
          <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="w-3 h-3" />
            Sugestões:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              disabled={isAiTyping}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 transition-all shrink-0 whitespace-nowrap cursor-pointer shadow-sm disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status e Botão da IA Gemini */}
          <button
            type="button"
            onClick={() => {
              setIsKeyModalOpen(true);
              setTestKeyStatus('idle');
              setTestKeyMessage('');
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer border ${
              connectionCheck === 'connected'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                : connectionCheck === 'testing'
                ? 'bg-slate-900 text-slate-400 border-slate-800'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={
              connectionCheck === 'connected'
                ? `Conectado à IA Google Gemini (${connectedModelName}). Respostas serão geradas pela IA.`
                : 'Conexão com a IA não ativa. Clique para configurar e conectar.'
            }
          >
            {connectionCheck === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">IA Ativa ({connectedModelName || 'Gemini'})</span>
              </>
            ) : connectionCheck === 'testing' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                <span className="hidden sm:inline">Testando Conexão IA...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <Database className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Modo Base ERP (Conectar IA)</span>
              </>
            )}
          </button>

          {/* Clear Chat History */}
          <button
            type="button"
            onClick={clearChatHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="Reiniciar conversa e limpar histórico"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 custom-scrollbar">
        {chatMessages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 sm:gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-5xl mx-auto`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isUser
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20'
              }`}>
                {isUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>

              {/* Message Bubble & Cards */}
              <div className={`flex-1 max-w-[92%] sm:max-w-[85%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none ml-auto max-w-2xl'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none'
                  }`}
                >
                  <RichChatMessage text={msg.text} isUser={isUser} />

                  <div className={`text-[10px] mt-2 flex flex-col gap-1.5 font-mono ${isUser ? 'text-cyan-100/70 items-end' : 'text-slate-500 items-start'}`}>
                    <div className="flex items-center justify-between w-full">
                      {!isUser && (
                        <span className="flex items-center gap-1.5">
                          {msg.source === 'gemini' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              <Sparkles className="w-2.5 h-2.5" />
                              Gemini 1.5
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 text-[10px] font-sans font-medium text-cyan-300 bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded"
                              title="Processamento analítico do QualiDecision conectado diretamente à base de dados do ERP e SAC."
                            >
                              <Database className="w-2.5 h-2.5 text-cyan-400" />
                              Base ERP / QualiDecision
                            </span>
                          )}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>

                    {!isUser && msg.geminiError && (
                      <div className="w-full text-[11px] font-sans text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2 text-left">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 overflow-hidden">
                          <p className="font-semibold text-amber-200">Google Gemini indisponível (respondido pelo motor local):</p>
                          <p className="text-[10px] text-amber-300/90 font-mono break-all leading-normal bg-black/30 p-1.5 rounded">{msg.geminiError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsKeyModalOpen(true);
                              setTestKeyStatus('idle');
                              setTestKeyMessage('');
                            }}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium inline-block cursor-pointer pt-0.5"
                          >
                            ⚡ Abrir teste e diagnóstico da chave
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button (Direct Creation of Concession) */}
                {msg.actionButton && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleActionButton(msg.actionButton)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{msg.actionButton.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Interactive Contextual Follow-up Chips */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium mr-1">Continuar:</span>
                    {msg.suggestedPrompts.map((sp, spIdx) => (
                      <button
                        key={spIdx}
                        type="button"
                        onClick={() => handleQuickPrompt(sp)}
                        disabled={isAiTyping}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-850 text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                )}

                {/* Attached Complaint Cards with Photos */}
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
                              {complaint.bales && complaint.bales.length > 0 ? (
                                <span className="text-xs font-semibold text-rose-300 font-mono">
                                  📦 Fardo{complaint.bales.length > 1 ? 's' : ''}: {complaint.bales.slice(0, 3).join(', ')}{complaint.bales.length > 3 ? '...' : ''}
                                </span>
                              ) : complaint.lotNumber ? (
                                <span className="text-xs font-semibold text-white">
                                  {complaint.lotNumber.startsWith('Fardo') ? complaint.lotNumber : `Lote: ${complaint.lotNumber}`}
                                </span>
                              ) : null}
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
                                      const balesInfo = complaint.bales?.length ? 'Fardos ' + complaint.bales.join(', ') : (complaint.lotNumber || '');
                                      setActivePhotoTitle(`${complaint.customerName} - [${complaint.code}] (${balesInfo})`);
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
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Envios Expedidos com Concessão Registrada ({msg.concessionCards.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {msg.concessionCards.map(c => (
                        <div key={c.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex flex-col justify-between space-y-2.5 shadow-md">
                          <div>
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5 mb-1.5">
                              <span className="font-mono font-bold text-cyan-400 text-[11px]">{c.code}</span>
                              {c.opNumber && (
                                <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40">
                                  OP: {c.opNumber}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-200">{c.customerName}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {c.bales && c.bales.length > 0 ? (
                                <span className="text-cyan-300 font-mono">📦 Fardo{c.bales.length > 1 ? 's' : ''}: {c.bales.slice(0, 3).join(', ')}{c.bales.length > 3 ? '...' : ''}</span>
                              ) : (
                                <span>{c.lotNumber}</span>
                              )} • {c.defectTypeName} ({c.quantity.toLocaleString('pt-BR')} un)
                            </div>
                            {c.technicalNotes && (
                              <p className="text-[11px] text-slate-300 italic bg-black/40 p-2 rounded-lg border border-slate-800/80 mt-1.5">
                                "{c.technicalNotes}"
                              </p>
                            )}
                          </div>

                          {/* Concession Photos Gallery */}
                          {c.photos && c.photos.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <Eye className="w-3 h-3 text-cyan-400" />
                                Fotos da liberação:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {c.photos.map(photo => (
                                  <div
                                    key={photo.id}
                                    onClick={() => {
                                      setActivePhoto(photo);
                                      const opText = c.opNumber ? ` (OP ${c.opNumber})` : '';
                                      setActivePhotoTitle(`${c.customerName} - [${c.code}] ${c.defectTypeName}${opText}`);
                                    }}
                                    className="relative group cursor-pointer w-20 h-16 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all shadow-md bg-black"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption || 'Foto da concessão'}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                      <Eye className="w-4 h-4 text-cyan-300" />
                                    </div>
                                    {photo.caption && (
                                      <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1 py-0.5 text-[8px] text-slate-200 truncate">
                                        {photo.caption}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-emerald-400 font-semibold">Refugo Evitado:</span>
                            <span className="font-mono font-bold text-cyan-400 text-xs">
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

        {/* Typing Indicator */}
        {isAiTyping && (
          <div className="flex items-start gap-3.5 max-w-5xl mx-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 rounded-tl-none flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium text-slate-400">Analisando histórico, tolerância do cliente e simulando decisão...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Fullscreen */}
      <form onSubmit={handleSend} className="p-3.5 sm:p-5 border-t border-slate-800/80 bg-slate-900/70 flex items-center gap-3">
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          disabled={isAiTyping}
          placeholder="Digite sua dúvida ou simulação (ex: Posso enviar 5 mil sacos com vinco para a Copacol?)..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 shadow-inner disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isAiTyping}
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

      {/* Pre-filled Concession Modal triggered from AI Action Button */}
      {isConcessionModalOpen && (
        <NewConcessionModal
          isOpen={isConcessionModalOpen}
          onClose={() => {
            setIsConcessionModalOpen(false);
            setConcessionInitialData(null);
          }}
          initialData={concessionInitialData}
        />
      )}

      {/* Modal de Configuração da Chave da API do Google Gemini */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chave Google Gemini & Diagnóstico</h3>
                  <p className="text-[11px] text-slate-400">Habilitar síntese em nuvem com Gemini 1.5</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                O sistema conta com o <strong>Motor Analítico QualiDecision</strong> operando localmente com 100% de precisão sobre a base do ERP e SAC.
              </p>
              <p className="text-[11px] text-slate-400">
                Para ativar respostas com o modelo em nuvem <strong>Google Gemini 1.5</strong>, você pode salvar a chave no navegador abaixo ou configurar a variável de ambiente <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> na Vercel (lembre-se de realizar um <em>Redeploy</em> após cadastrar na Vercel).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>API Key do Gemini:</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline font-normal text-[10px]"
                >
                  Obter chave grátis no Google AI Studio ↗
                </a>
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => {
                  setApiKeyInput(e.target.value);
                  setTestKeyStatus('idle');
                  setTestKeyMessage('');
                }}
                placeholder="AIzaSy... (ou deixe vazio para testar a chave da Vercel)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Botão de Teste de Conexão */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testKeyStatus === 'testing'}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
              >
                {testKeyStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Testando com Google API...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>⚡ Testar Conexão com Gemini</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-500">
                {apiKeyInput ? 'Testará a chave acima' : 'Testará variável da Vercel'}
              </span>
            </div>

            {/* Painel de Resultado do Diagnóstico */}
            {testKeyStatus === 'success' && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Google Gemini Conectado com Sucesso!</span>
                </div>
                <div className="text-[11px] space-y-1 text-emerald-300/80 font-mono bg-black/30 p-2.5 rounded-lg border border-emerald-500/20">
                  <p>• Origem: <span className="text-white font-semibold">{testKeyDetails?.source}</span></p>
                  <p>• Modelo: <span className="text-white font-semibold">{testKeyDetails?.model}</span></p>
                  <p>• Chave: <span className="text-white font-semibold">{testKeyDetails?.keyPrefix}</span></p>
                  <p>• Resposta recebida: <span className="text-emerald-300 font-semibold">"{testKeyDetails?.reply}"</span></p>
                </div>
                <p className="text-[11px] text-emerald-300 font-sans">
                  ✨ O Gemini está pronto para sintetizar as respostas técnicas em conjunto com os dados do QualiDecision.
                </p>
              </div>
            )}

            {testKeyStatus === 'error' && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2 text-xs text-rose-200">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Falha ao validar chave com o Google:</span>
                </div>
                <p className="text-[11px] font-mono break-all text-rose-200 bg-black/40 p-2.5 rounded-lg border border-rose-900/50">
                  {testKeyMessage}
                </p>
                <div className="text-[11px] text-slate-300 font-sans space-y-1 pt-1 leading-relaxed">
                  {testKeyMessage.toLowerCase().includes('blocked') ? (
                    <div className="space-y-1.5 text-amber-200 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30">
                      <p className="font-semibold text-amber-300">
                        🚫 O Google bloqueou o método da API (API_KEY_SERVICE_BLOCKED):
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-200">
                        Isso acontece quando a chave possui <strong>Restrições de API</strong> ativadas no Google Cloud Console e a <em>Generative Language API</em> não está autorizada, ou quando pertence a uma conta/projeto corporativo com bloqueio de IA.
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-200">
                        <strong>Solução mais simples e garantida:</strong>
                        <br />1. Abra o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Google AI Studio (aistudio.google.com/app/apikey)</a>.
                        <br />2. Clique em <strong>"Create API key"</strong> e escolha <strong>"Create API key in new project"</strong> (em novo projeto sem restrições herdadas).
                        <br />3. Cole a nova chave gerada no campo acima e clique em <strong>Testar Conexão</strong>.
                      </p>
                    </div>
                  ) : testKeyMessage.toLowerCase().includes('not valid') || testKeyMessage.toLowerCase().includes('invalid') ? (
                    <p className="text-amber-300">
                      👉 <strong>Motivo provável:</strong> A chave informada não é reconhecida pelo Google Gemini. Gere uma nova chave no <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Google AI Studio</a> e cole-a aqui.
                    </p>
                  ) : testKeyMessage.toLowerCase().includes('disabled') || testKeyMessage.toLowerCase().includes('not been used') ? (
                    <p className="text-amber-300">
                      👉 <strong>Motivo provável:</strong> A "Generative Language API" está desativada no seu projeto Google Cloud. Acesse a URL indicada na mensagem para ativá-la.
                    </p>
                  ) : testKeyMessage.toLowerCase().includes('nenhuma chave') ? (
                    <p className="text-amber-300">
                      👉 <strong>Motivo provável:</strong> Nenhuma chave foi encontrada. Cole a chave do Google AI Studio no campo acima ou cadastre a variável <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 font-mono">GEMINI_API_KEY</code> na Vercel e faça um <strong>Redeploy</strong>.
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {hasApiKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('');
                    storageService.saveGeminiApiKey('');
                    setHasApiKey(false);
                    setTestKeyStatus('idle');
                    setTestKeyMessage('');
                    setIsKeyModalOpen(false);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Remover chave salva
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition-all cursor-pointer shadow-md"
                >
                  Salvar Chave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
