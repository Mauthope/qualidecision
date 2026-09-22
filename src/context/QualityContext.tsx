'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Customer, DefectType, Complaint, ConcessionShipment, QualityStats, AiChatMessage, RiskEvaluationResult, ToleranceLevel, DefectSeverity, DefectCategory, QualitySettings } from '@/types';
import { storageService, DEFAULT_QUALITY_SETTINGS } from '@/services/storageService';
import { supabaseService } from '@/services/supabaseService';
import { qualityService } from '@/services/qualityService';
import { aiAssistantService } from '@/services/aiAssistantService';
import { DEFAULT_CUSTOMERS, DEFAULT_DEFECTS, DEFAULT_COMPLAINTS, DEFAULT_CONCESSIONS } from '@/data/defaultQualityData';

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
  settings: QualitySettings;
  updateSettings: (newSettings: Partial<QualitySettings>) => void;
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
    customerNumber?: string;
    opNumber?: string;
    date?: string;
    lotNumber?: string;
    bales?: string[];
    productName: string;
    defectTypeId: string;
    quantity: number;
    severity: DefectSeverity;
    unitSavedValue?: number;
    technicalNotes: string;
    approvedBy?: string;
    photos?: Array<{ id: string; url: string; caption: string; defectLocation?: string }>;
  }) => ConcessionShipment;
  deleteConcession: (id: string) => Promise<boolean>;
  deleteComplaint: (id: string) => Promise<boolean>;
  addCustomer: (data: {
    name: string;
    code?: string;
    segment?: string;
    location?: string;
    initialProfile?: 'padrao' | 'exigente' | 'flexivel';
  }) => Customer;
  addDefect: (data: {
    name: string;
    category: DefectCategory;
    description?: string;
    color?: string;
    defaultUnitLoss?: number;
  }) => DefectType;
  addComplaint: (data: {
    customerId: string;
    date?: string;
    lotNumber?: string;
    bales?: string[];
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
  isAiTyping: boolean;
  prefillConcessionData: {
    customerId?: string;
    defectTypeId?: string;
    quantity?: number;
    severity?: DefectSeverity;
  } | null;
  setPrefillConcessionData: (data: { customerId?: string; defectTypeId?: string; quantity?: number; severity?: DefectSeverity } | null) => void;
  clearChatHistory: () => void;
  evaluateRisk: (customerId: string, defectTypeId: string, quantity: number, severity: DefectSeverity) => RiskEvaluationResult | null;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  isLoaded: boolean;
  isSyncing: boolean;
  refreshData: () => Promise<void>;
}

const QualityContext = createContext<QualityContextType | undefined>(undefined);

export const QualityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização síncrona com dados do cache/default para evitar tela branca ou travamento
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = storageService.getCustomers();
        if (cached && cached.length > 0) return cached;
      } catch (e) {
        console.warn('Erro ao ler cache inicial de clientes:', e);
      }
    }
    return DEFAULT_CUSTOMERS;
  });

  const [defects, setDefects] = useState<DefectType[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = storageService.getDefects();
        if (cached && cached.length > 0) return cached;
      } catch (e) {
        console.warn('Erro ao ler cache inicial de defeitos:', e);
      }
    }
    return DEFAULT_DEFECTS;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = storageService.getComplaints();
        if (cached && cached.length > 0) return cached;
      } catch (e) {
        console.warn('Erro ao ler cache inicial de reclamações:', e);
      }
    }
    return DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] }));
  });

  const [concessions, setConcessions] = useState<ConcessionShipment[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = storageService.getConcessions();
        if (cached && cached.length > 0) return cached;
      } catch (e) {
        console.warn('Erro ao ler cache inicial de concessões:', e);
      }
    }
    return DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] }));
  });

  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = storageService.getChatMessages();
        if (cached && cached.length > 0) return cached;
      } catch (e) {
        console.warn(e);
      }
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Olá! Sou a **IA de Qualidade & Perfil de Clientes**.\n\nPergunte-me sobre reclamações de clientes (ex: *"Quais foram as reclamações do cliente Alisul?"*) ou simule um envio de lote com defeito (*"Posso mandar 5.000 sacos com vinco para a Alisul?"*).',
        timestamp: 'Agora'
      }
    ];
  });

  const [settings, setSettings] = useState<QualitySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        return storageService.getSettings();
      } catch (e) {
        console.warn('Erro ao ler cache inicial de configurações:', e);
      }
    }
    return DEFAULT_QUALITY_SETTINGS;
  });

  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [prefillConcessionData, setPrefillConcessionData] = useState<{
    customerId?: string;
    defectTypeId?: string;
    quantity?: number;
    severity?: DefectSeverity;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Hidratação Instantânea do Cache Local (0ms - executada imediatamente no browser)
  useEffect(() => {
    try {
      const cCust = storageService.getCustomers();
      const cDef = storageService.getDefects();
      const cComp = storageService.getComplaints();
      const cConc = storageService.getConcessions();
      const cSet = storageService.getSettings();

      if (cCust && cCust.length > 0) setCustomers(cCust);
      if (cDef && cDef.length > 0) setDefects(cDef);
      if (cComp && cComp.length > 0) setComplaints(cComp);
      if (cConc && cConc.length > 0) setConcessions(cConc);
      if (cSet) setSettings(cSet);

      if (cConc && cConc.length > 0) {
        setIsLoaded(true);
      }
    } catch (e) {
      console.warn('Erro ao hidratar cache instantâneo:', e);
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Carga e sincronização assíncrona com o Supabase (Stale-While-Revalidate em background)
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const {
        customers: loadedCustomers,
        defects: loadedDefects,
        complaints: loadedComplaints,
        concessions: loadedConcessions,
        settings: loadedSettings
      } = await supabaseService.getAllQualityData();

      const activeSettings = loadedSettings || storageService.getSettings();
      setSettings(activeSettings);
      storageService.saveSettings(activeSettings);

      // Calibração do valor do refugo industrial
      const calibratedConcessions = loadedConcessions.map(c => ({
        ...c,
        totalSavedValue: c.totalSavedValue || qualityService.calculateSavedProfit(c.quantity, activeSettings.sackWeightGrams, activeSettings.costPerKg),
        unitSavedValue: c.unitSavedValue || qualityService.calculateUnitSavedValue(activeSettings.sackWeightGrams, activeSettings.costPerKg)
      }));

      // Calibração dos perfis de tolerância de acordo com as queixas reais
      const calibratedCustomers = loadedCustomers.map(customer => {
        const { overallToleranceScore, toleranceRatings } = qualityService.calculateCustomerTolerance(
          customer,
          loadedComplaints,
          calibratedConcessions,
          loadedDefects
        );
        return {
          ...customer,
          overallToleranceScore,
          toleranceRatings
        };
      });

      setCustomers(calibratedCustomers);
      setDefects(loadedDefects);
      setComplaints(loadedComplaints);
      setConcessions(calibratedConcessions);
      setIsLoaded(true);

      // Salvar silenciosamente no cache local (sem disparar eventos circulares)
      storageService.saveCustomers(calibratedCustomers);
      storageService.saveDefects(loadedDefects);
      storageService.saveComplaints(loadedComplaints);
      storageService.saveConcessions(calibratedConcessions);
    } catch (err) {
      console.error('Erro ao sincronizar com Supabase:', err);
    } finally {
      setIsSyncing(false);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Sincroniza dados do Supabase na inicialização
    loadData();
  }, [loadData]);

  // Derived KPIs memoizados para evitar renderizações pesadas
  const stats = useMemo(() => {
    return qualityService.calculateStats(customers, defects, complaints, concessions);
  }, [customers, defects, complaints, concessions]);

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
    customerNumber?: string;
    opNumber?: string;
    date?: string;
    lotNumber?: string;
    bales?: string[];
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
    const unitSavedValue = data.unitSavedValue ?? qualityService.calculateUnitSavedValue(settings.sackWeightGrams, settings.costPerKg);
    const totalSavedValue = qualityService.calculateSavedProfit(data.quantity, settings.sackWeightGrams, settings.costPerKg);

    // Calculate risk
    const riskResult = customer && defect
      ? qualityService.evaluateConcessionRisk(customer, defect, data.quantity, data.severity, complaints, concessions)
      : null;

    const entryDate = data.date?.trim() || new Date().toISOString().split('T')[0];
    const year = entryDate.slice(0, 4);

    const baleList = data.bales || [];
    const resolvedLotOrBale = data.lotNumber?.trim() || (baleList.length > 0 ? (baleList.length === 1 ? `Fardo #${baleList[0]}` : `Fardos ${baleList.join(', ')}`) : 'Fardo N/I');

    const newConcession: ConcessionShipment = {
      id: `env-${Date.now()}`,
      code: `ENV-${year}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: data.customerId,
      customerName,
      customerNumber: data.customerNumber?.trim() || customer?.code,
      opNumber: data.opNumber?.trim() || `OP-${Date.now().toString().slice(-6)}`,
      date: entryDate,
      lotNumber: resolvedLotOrBale,
      bales: baleList,
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

    const updated = [newConcession, ...concessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setConcessions(updated);
    storageService.saveConcessions(updated);
    supabaseService.saveConcession(newConcession);

    const updatedCustomers = customers.map(c => {
      const { overallToleranceScore, toleranceRatings } = qualityService.calculateCustomerTolerance(
        c,
        complaints,
        updated,
        defects
      );
      return {
        ...c,
        overallToleranceScore,
        toleranceRatings
      };
    });
    setCustomers(updatedCustomers);
    storageService.saveCustomers(updatedCustomers);

    showToast(`Concessão ${newConcession.code} registrada com sucesso!`, 'success');
    return newConcession;
  }, [customers, defects, complaints, concessions, settings, showToast]);

  const deleteConcession = useCallback(async (id: string): Promise<boolean> => {
    const target = concessions.find(c => c.id === id);
    const updated = concessions.filter(c => c.id !== id);
    setConcessions(updated);
    storageService.saveConcessions(updated);

    try {
      await supabaseService.deleteConcession(id);
    } catch (e) {
      console.error('Erro ao excluir no Supabase:', e);
    }

    // Recalcula a matriz de tolerância dos clientes
    const updatedCustomers = customers.map(c => {
      const { overallToleranceScore, toleranceRatings } = qualityService.calculateCustomerTolerance(
        c,
        complaints,
        updated,
        defects
      );
      return {
        ...c,
        overallToleranceScore,
        toleranceRatings
      };
    });
    setCustomers(updatedCustomers);
    storageService.saveCustomers(updatedCustomers);

    showToast(`Envio com concessão ${target?.code || ''} excluído com sucesso!`, 'info');
    return true;
  }, [concessions, customers, complaints, defects, showToast]);

  const updateSettings = useCallback((newSettings: Partial<QualitySettings>) => {
    setSettings(prev => {
      const updated: QualitySettings = {
        ...prev,
        ...newSettings,
        updatedAt: new Date().toISOString()
      };
      storageService.saveSettings(updated);
      supabaseService.saveSettings(updated);
      showToast('Parâmetros industriais (custo/peso) atualizados com sucesso!', 'success');
      return updated;
    });
  }, [showToast]);

  const addCustomer = useCallback((data: {
    name: string;
    code?: string;
    segment?: string;
    location?: string;
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
      location: data.location?.trim() || undefined,
      cityState: data.location?.trim() || undefined,
      overallToleranceScore,
      avatarColor: avatarGradients[customers.length % avatarGradients.length],
      toleranceRatings,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    storageService.saveCustomers(updated);
    supabaseService.saveCustomer(newCustomer);
    showToast(`Cliente ${newCustomer.name} cadastrado com sucesso!`, 'success');
    return newCustomer;
  }, [customers, defects, showToast]);

  const addDefect = useCallback((data: {
    name: string;
    category: DefectCategory;
    description?: string;
    color?: string;
    defaultUnitLoss?: number;
  }): DefectType => {
    const slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = `def-${slug}-${Date.now().toString().slice(-4)}`;
    const categoryColors: Record<DefectCategory, string> = {
      costura: '#ef4444',
      estrutural: '#f97316',
      impressao: '#f59e0b',
      dimensional: '#8b5cf6',
      visual: '#06b6d4',
      solda: '#10b981',
      outro: '#64748b'
    };

    const newDefect: DefectType = {
      id: newId,
      name: data.name.trim(),
      category: data.category,
      description: data.description?.trim() || `Não-conformidade de ${data.name.trim()} catalogada pela equipe de qualidade.`,
      defaultUnitLoss: data.defaultUnitLoss || 15.00,
      color: data.color || categoryColors[data.category] || '#06b6d4'
    };

    const updated = [newDefect, ...defects];
    setDefects(updated);
    storageService.saveDefects(updated);
    supabaseService.saveDefect(newDefect);
    showToast(`Defeito "${newDefect.name}" cadastrado com sucesso!`, 'success');
    return newDefect;
  }, [defects, showToast]);

  const addComplaint = useCallback((data: {
    customerId: string;
    date?: string;
    lotNumber?: string;
    bales?: string[];
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

    const entryDate = data.date?.trim() || new Date().toISOString().split('T')[0];
    const year = entryDate.slice(0, 4);

    const baleList = data.bales || [];
    const resolvedLotOrBale = data.lotNumber?.trim() || (baleList.length > 0 ? (baleList.length === 1 ? `Fardo #${baleList[0]}` : `Fardos ${baleList.join(', ')}`) : 'Fardo N/I');

    const newComplaint: Complaint = {
      id: `rec-${Date.now()}`,
      code: `REC-${year}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: data.customerId,
      customerName,
      date: entryDate,
      lotNumber: resolvedLotOrBale,
      bales: baleList,
      defectTypeId: data.defectTypeId,
      defectTypeName,
      quantityAffected: data.quantityAffected,
      severity: data.severity,
      description: data.description,
      rootCause: data.rootCause || 'Em análise técnica preliminar',
      correctiveAction: data.correctiveAction || 'Investigação de processo aberta',
      status: 'aberta',
      origin: data.origin || 'sac_manual',
      photos: data.photos || [],
      costImpact: data.quantityAffected * (defect?.defaultUnitLoss || 18.00)
    };

    const updated = [newComplaint, ...complaints].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setComplaints(updated);
    storageService.saveComplaints(updated);
    supabaseService.saveComplaint(newComplaint);

    // Recalibrate customers with the new complaint
    const updatedCustomers = customers.map(c => {
      const { overallToleranceScore, toleranceRatings } = qualityService.calculateCustomerTolerance(
        c,
        updated,
        concessions,
        defects
      );
      return {
        ...c,
        overallToleranceScore,
        toleranceRatings
      };
    });
    setCustomers(updatedCustomers);
    storageService.saveCustomers(updatedCustomers);

    showToast(`Reclamação ${newComplaint.code} cadastrada no sistema!`, 'warning');
    return newComplaint;
  }, [customers, defects, complaints, concessions, showToast]);

  const deleteComplaint = useCallback(async (id: string): Promise<boolean> => {
    const target = complaints.find(c => c.id === id);
    const updated = complaints.filter(c => c.id !== id);
    setComplaints(updated);
    storageService.saveComplaints(updated);

    try {
      await supabaseService.deleteComplaint(id);
    } catch (e) {
      console.error('Erro ao excluir reclamação no Supabase:', e);
    }

    const updatedCustomers = customers.map(c => {
      const { overallToleranceScore, toleranceRatings } = qualityService.calculateCustomerTolerance(
        c,
        updated,
        concessions,
        defects
      );
      return {
        ...c,
        overallToleranceScore,
        toleranceRatings
      };
    });
    setCustomers(updatedCustomers);
    storageService.saveCustomers(updatedCustomers);

    showToast(`Reclamação ${target?.code || ''} excluída com sucesso!`, 'info');
    return true;
  }, [complaints, customers, concessions, defects, showToast]);

  const updateCustomerTolerance = useCallback((
    customerId: string,
    defectId: string,
    level: ToleranceLevel,
    notes?: string
  ) => {
    let targetUpdatedRatings: Record<string, { level: ToleranceLevel; notes?: string }> = {};
    let targetOverallScore = 70;

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

      targetUpdatedRatings = updatedRatings;
      targetOverallScore = overallScore;

      return {
        ...c,
        toleranceRatings: updatedRatings,
        overallToleranceScore: overallScore
      };
    });

    setCustomers(updated);
    storageService.saveCustomers(updated);
    supabaseService.updateCustomerTolerance(customerId, targetUpdatedRatings, targetOverallScore);
    showToast('Perfil de tolerância do cliente atualizado!', 'success');
  }, [customers, showToast]);

  const sendAiMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    const userMessage: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setIsAiTyping(true);

    try {
      const localGeminiKey = storageService.getGeminiApiKey();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: newHistory,
          customers,
          defects,
          complaints,
          concessions,
          apiKey: localGeminiKey || undefined
        })
      });

      if (response.ok) {
        const aiResponse: AiChatMessage = await response.json();
        const updatedHistory = [...newHistory, aiResponse];
        setChatMessages(updatedHistory);
        storageService.saveChatMessages(updatedHistory);
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (err) {
      console.warn('Fallback to local engine:', err);
      const aiResponse = aiAssistantService.processQuery(
        prompt,
        newHistory,
        customers,
        defects,
        complaints,
        concessions
      );
      const updatedHistory = [...newHistory, aiResponse];
      setChatMessages(updatedHistory);
      storageService.saveChatMessages(updatedHistory);
    } finally {
      setIsAiTyping(false);
    }
  }, [chatMessages, customers, defects, complaints, concessions]);

  const clearChatHistory = useCallback(() => {
    const welcomeMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: 'Olá! Conversa reiniciada. Sou o **Especialista em Inteligência de Qualidade e Decisão**.\n\nComo posso te ajudar hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'Posso enviar 10.000 sacos com vinco para a Copacol?',
        'Qual o perfil de tolerância da Alisul?',
        'Quais clientes aceitam borrão de impressão?',
        'Quanto de refugo foi evitado este mês?'
      ]
    };
    setChatMessages([welcomeMsg]);
    storageService.saveChatMessages([welcomeMsg]);
    showToast('Histórico de conversa reiniciado!', 'info');
  }, [showToast]);

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

  return (
    <QualityContext.Provider
      value={{
        customers,
        defects,
        complaints,
        concessions,
        settings,
        updateSettings,
        stats,
        chatMessages,
        isAiDrawerOpen,
        isAiTyping,
        prefillConcessionData,
        setPrefillConcessionData,
        clearChatHistory,
        toasts,
        searchQuery,
        setSearchQuery,
        openAiDrawer,
        closeAiDrawer,
        addConcession,
        deleteConcession,
        addCustomer,
        addDefect,
        addComplaint,
        deleteComplaint,
        updateCustomerTolerance,
        sendAiMessage,
        evaluateRisk,
        resetData,
        exportData,
        importData,
        showToast,
        isLoaded,
        isSyncing,
        refreshData: loadData
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
