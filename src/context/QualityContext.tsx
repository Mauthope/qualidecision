'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, DefectType, Complaint, ConcessionShipment, QualityStats, AiChatMessage, RiskEvaluationResult, ToleranceLevel, DefectSeverity } from '@/types';
import { storageService } from '@/services/storageService';
import { qualityService } from '@/services/qualityService';
import { aiAssistantService } from '@/services/aiAssistantService';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface QualityContextType {
  customers: Customer[];
  defects: DefectType[];
  complaints: Complaint[];
  concessions: ConcessionShipment[];
  stats: QualityStats;
  chatMessages: AiChatMessage[];
  isAiDrawerOpen: boolean;
  toasts: ToastState[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openAiDrawer: (initialPrompt?: string) => void;
  closeAiDrawer: () => void;
  addConcession: (data: {
    customerId: string;
    lotNumber: string;
    productName: string;
    defectTypeId: string;
    quantity: number;
    severity: DefectSeverity;
    unitSavedValue?: number;
    technicalNotes: string;
    approvedBy?: string;
    photos?: Array<{ id: string; url: string; caption: string; defectLocation?: string }>;
  }) => ConcessionShipment;
  addCustomer: (data: {
    name: string;
    code?: string;
    segment?: string;
    initialProfile?: 'padrao' | 'exigente' | 'flexivel';
  }) => Customer;
  addComplaint: (data: {
    customerId: string;
    lotNumber: string;
    defectTypeId: string;
    quantityAffected: number;
    severity: DefectSeverity;
    description: string;
    rootCause?: string;
    correctiveAction?: string;
    origin?: 'erp_sync' | 'sac_manual';
    photos?: Array<{ id: string; url: string; caption: string; defectLocation?: string }>;
  }) => Complaint;
  updateCustomerTolerance: (customerId: string, defectId: string, level: ToleranceLevel, notes?: string) => void;
  sendAiMessage: (prompt: string) => void;
  evaluateRisk: (customerId: string, defectTypeId: string, quantity: number, severity: DefectSeverity) => RiskEvaluationResult | null;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const QualityContext = createContext<QualityContextType | undefined>(undefined);

export const QualityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [defects, setDefects] = useState<DefectType[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [concessions, setConcessions] = useState<ConcessionShipment[]>([]);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Initial Load from Storage
  const loadData = useCallback(() => {
    const loadedCustomers = storageService.getCustomers();
    const loadedDefects = storageService.getDefects();
    const loadedComplaints = storageService.getComplaints();
    const loadedConcessions = storageService.getConcessions();
    const loadedChat = storageService.getChatMessages();

    setCustomers(loadedCustomers);
    setDefects(loadedDefects);
    setComplaints(loadedComplaints);
    setConcessions(loadedConcessions);

    if (loadedChat.length === 0) {
      const welcomeMessage: AiChatMessage = {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Olá! Sou a **IA de Qualidade & Perfil de Clientes**.\n\nPergunte-me sobre reclamações de clientes (ex: *"Quais foram as reclamações do cliente Alisul?"*) ou simule um envio de lote com defeito (*"Posso mandar 5.000 sacos com vinco para a Alisul?"*).',
        timestamp: 'Agora'
      };
      setChatMessages([welcomeMessage]);
      storageService.saveChatMessages([welcomeMessage]);
    } else {
      setChatMessages(loadedChat);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener('qualitrack_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('qualitrack_storage_update', handleStorageUpdate);
    };
  }, [loadData]);

  // Derived KPIs
  const stats = qualityService.calculateStats(customers, defects, complaints, concessions);

  const evaluateRisk = useCallback((
    customerId: string,
    defectTypeId: string,
    quantity: number,
    severity: DefectSeverity
  ): RiskEvaluationResult | null => {
    const customer = customers.find(c => c.id === customerId);
    const defect = defects.find(d => d.id === defectTypeId);
    if (!customer || !defect) return null;

    return qualityService.evaluateConcessionRisk(customer, defect, quantity, severity, complaints, concessions);
  }, [customers, defects, complaints, concessions]);

  const addConcession = useCallback((data: {
    customerId: string;
    lotNumber: string;
    productName: string;
    defectTypeId: string;
    quantity: number;
    severity: DefectSeverity;
    unitSavedValue?: number;
    technicalNotes: string;
    approvedBy?: string;
    photos?: Array<{ id: string; url: string; caption: string; defectLocation?: string }>;
  }): ConcessionShipment => {
    const customer = customers.find(c => c.id === data.customerId);
    const defect = defects.find(d => d.id === data.defectTypeId);
    const customerName = customer?.name || 'Cliente';
    const defectTypeName = defect?.name || 'Defeito';
    const unitSavedValue = data.unitSavedValue ?? (defect?.defaultUnitLoss || 15.00);
    const totalSavedValue = data.quantity * unitSavedValue;

    // Calculate risk
    const riskResult = customer && defect
      ? qualityService.evaluateConcessionRisk(customer, defect, data.quantity, data.severity, complaints, concessions)
      : null;

    const newConcession: ConcessionShipment = {
      id: `env-${Date.now()}`,
      code: `ENV-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: data.customerId,
      customerName,
      date: new Date().toISOString().split('T')[0],
      lotNumber: data.lotNumber,
      productName: data.productName,
      defectTypeId: data.defectTypeId,
      defectTypeName,
      quantity: data.quantity,
      severity: data.severity,
      unitSavedValue,
      totalSavedValue,
      riskScore: riskResult?.riskLevel || 'baixo',
      customerFeedbackStatus: 'em_transito',
      technicalNotes: data.technicalNotes,
      approvedBy: data.approvedBy || 'Mauricio Grigol (Qualidade)',
      photos: data.photos || []
    };

    const updated = [newConcession, ...concessions];
    setConcessions(updated);
    storageService.saveConcessions(updated);
    showToast(`Concessão ${newConcession.code} registrada com sucesso!`, 'success');
    return newConcession;
  }, [customers, defects, complaints, concessions, showToast]);

  const addCustomer = useCallback((data: {
    name: string;
    code?: string;
    segment?: string;
    initialProfile?: 'padrao' | 'exigente' | 'flexivel';
  }): Customer => {
    const slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = `cli-${slug}-${Date.now().toString().slice(-4)}`;
    const profile = data.initialProfile || 'padrao';

    const avatarGradients = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600'
    ];

    // Build baseline tolerance ratings across all 69 defect types
    const toleranceRatings: Record<string, { level: ToleranceLevel; notes?: string }> = {};
    defects.forEach(def => {
      if (profile === 'flexivel') {
        toleranceRatings[def.id] = {
          level: 'alta',
          notes: 'Cliente cadastrado com perfil flexível. Alta aceitação inicial.'
        };
      } else if (profile === 'exigente') {
        if (def.category === 'costura' || def.category === 'estrutural') {
          toleranceRatings[def.id] = {
            level: 'baixa',
            notes: 'Perfil exigente: tolerância restrita a desvios estruturais/costura.'
          };
        } else if (def.category === 'dimensional') {
          toleranceRatings[def.id] = {
            level: 'moderada',
            notes: 'Perfil exigente: aceita apenas desvios dimensionais mínimos.'
          };
        } else {
          toleranceRatings[def.id] = {
            level: 'moderada',
            notes: 'Perfil exigente: desvio estético requer alinhamento prévio.'
          };
        }
      } else {
        // padrao
        if (def.category === 'costura' || def.category === 'estrutural') {
          toleranceRatings[def.id] = {
            level: 'moderada',
            notes: 'Perfil padrão: aceita desvios leves sob inspeção.'
          };
        } else {
          toleranceRatings[def.id] = {
            level: 'alta',
            notes: 'Perfil padrão: alta flexibilidade para desvios estéticos e visuais.'
          };
        }
      }
    });

    const scoreMap = { alta: 100, moderada: 70, baixa: 40, intolerante: 10 };
    const totalPoints = defects.reduce((sum, def) => sum + (scoreMap[toleranceRatings[def.id]?.level || 'moderada'] || 70), 0);
    const overallToleranceScore = Math.round(totalPoints / Math.max(defects.length, 1));

    const nextCode = `CLI-${String(customers.length + 1).padStart(3, '0')}`;

    const newCustomer: Customer = {
      id: newId,
      name: data.name.trim(),
      code: data.code?.trim() || nextCode,
      segment: data.segment?.trim() || 'Sacaria e Big Bags',
      overallToleranceScore,
      avatarColor: avatarGradients[customers.length % avatarGradients.length],
      toleranceRatings,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    storageService.saveCustomers(updated);
    showToast(`Cliente ${newCustomer.name} cadastrado com sucesso!`, 'success');
    return newCustomer;
  }, [customers, defects, showToast]);

  const addComplaint = useCallback((data: {
    customerId: string;
    lotNumber: string;
    defectTypeId: string;
    quantityAffected: number;
    severity: DefectSeverity;
    description: string;
    rootCause?: string;
    correctiveAction?: string;
    origin?: 'erp_sync' | 'sac_manual';
    photos?: Array<{ id: string; url: string; caption: string; defectLocation?: string }>;
  }): Complaint => {
    const customer = customers.find(c => c.id === data.customerId);
    const defect = defects.find(d => d.id === data.defectTypeId);
    const customerName = customer?.name || 'Cliente';
    const defectTypeName = defect?.name || 'Defeito';

    const newComplaint: Complaint = {
      id: `rec-${Date.now()}`,
      code: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: data.customerId,
      customerName,
      date: new Date().toISOString().split('T')[0],
      lotNumber: data.lotNumber,
      defectTypeId: data.defectTypeId,
      defectTypeName,
      quantityAffected: data.quantityAffected,
      severity: data.severity,
      description: data.description,
      rootCause: data.rootCause || 'Em análise técnica preliminar',
      correctiveAction: data.correctiveAction || 'Investigação de processo aberta',
      status: 'aberta',
      origin: data.origin || 'sac_manual',
      photos: data.photos || [
        {
          id: `photo-${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
          caption: 'Evidência fotográfica registrada no recebimento'
        }
      ],
      costImpact: data.quantityAffected * (defect?.defaultUnitLoss || 18.00)
    };

    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    storageService.saveComplaints(updated);
    showToast(`Reclamação ${newComplaint.code} cadastrada no sistema!`, 'warning');
    return newComplaint;
  }, [customers, defects, complaints, showToast]);

  const updateCustomerTolerance = useCallback((
    customerId: string,
    defectId: string,
    level: ToleranceLevel,
    notes?: string
  ) => {
    const updated = customers.map(c => {
      if (c.id !== customerId) return c;
      const updatedRatings = {
        ...c.toleranceRatings,
        [defectId]: {
          level,
          notes: notes || c.toleranceRatings[defectId]?.notes || ''
        }
      };

      // Recalculate score
      const levels = Object.values(updatedRatings).map(r => r.level);
      const points = levels.reduce((acc, lvl) => {
        if (lvl === 'alta') return acc + 100;
        if (lvl === 'moderada') return acc + 70;
        if (lvl === 'baixa') return acc + 40;
        return acc + 10;
      }, 0);
      const overallScore = Math.round(points / Math.max(levels.length, 1));

      return {
        ...c,
        toleranceRatings: updatedRatings,
        overallToleranceScore: overallScore
      };
    });

    setCustomers(updated);
    storageService.saveCustomers(updated);
    showToast('Perfil de tolerância do cliente atualizado!', 'success');
  }, [customers, showToast]);

  const sendAiMessage = useCallback((prompt: string) => {
    if (!prompt.trim()) return;

    const userMessage: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);

    // Process with AI Service
    setTimeout(() => {
      const aiResponse = aiAssistantService.processQuery(prompt, customers, defects, complaints, concessions);
      const updatedHistory = [...newHistory, aiResponse];
      setChatMessages(updatedHistory);
      storageService.saveChatMessages(updatedHistory);
    }, 450);
  }, [chatMessages, customers, defects, complaints, concessions]);

  const openAiDrawer = useCallback((initialPrompt?: string) => {
    setIsAiDrawerOpen(true);
    if (initialPrompt) {
      setTimeout(() => {
        sendAiMessage(initialPrompt);
      }, 100);
    }
  }, [sendAiMessage]);

  const closeAiDrawer = useCallback(() => {
    setIsAiDrawerOpen(false);
  }, []);

  const resetData = useCallback(() => {
    storageService.resetToDefaults();
    loadData();
    showToast('Dados restaurados para o padrão de fábrica!', 'info');
  }, [loadData, showToast]);

  const exportData = useCallback(() => {
    return storageService.exportAllData();
  }, []);

  const importData = useCallback((json: string) => {
    const success = storageService.importAllData(json);
    if (success) {
      loadData();
      showToast('Dados importados com sucesso!', 'success');
      return true;
    }
    showToast('Erro ao importar arquivo JSON.', 'error');
    return false;
  }, [loadData, showToast]);

  if (!isLoaded) {
    return null;
  }

  return (
    <QualityContext.Provider
      value={{
        customers,
        defects,
        complaints,
        concessions,
        stats,
        chatMessages,
        isAiDrawerOpen,
        toasts,
        searchQuery,
        setSearchQuery,
        openAiDrawer,
        closeAiDrawer,
        addConcession,
        addCustomer,
        addComplaint,
        updateCustomerTolerance,
        sendAiMessage,
        evaluateRisk,
        resetData,
        exportData,
        importData,
        showToast
      }}
    >
      {children}
    </QualityContext.Provider>
  );
};

export const useQuality = () => {
  const context = useContext(QualityContext);
  if (!context) {
    throw new Error('useQuality deve ser usado dentro de um QualityProvider');
  }
  return context;
};
