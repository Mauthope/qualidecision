import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage, QualitySettings } from '@/types';
import { DEFAULT_CUSTOMERS, DEFAULT_DEFECTS, DEFAULT_COMPLAINTS, DEFAULT_CONCESSIONS } from '@/data/defaultQualityData';

export const DEFAULT_QUALITY_SETTINGS: QualitySettings = {
  sackWeightGrams: 77.73,
  costPerKg: 1.50
};

const STORAGE_KEYS = {
  CUSTOMERS: 'qualitrack_customers_v4_concession_feedback',
  DEFECTS: 'qualitrack_defects_v4_concession_feedback',
  COMPLAINTS: 'qualitrack_complaints_v4_concession_feedback',
  CONCESSIONS: 'qualitrack_concessions_v5_clean',
  CHAT_MESSAGES: 'qualitrack_chat_v4_concession_feedback',
  SETTINGS: 'qualitrack_settings_v1'
};

const isBrowser = typeof window !== 'undefined';

export const storageService = {
  getCustomers(): Customer[] {
    if (!isBrowser) return DEFAULT_CUSTOMERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!data) {
        this.saveCustomers(DEFAULT_CUSTOMERS);
        return DEFAULT_CUSTOMERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  },

  saveCustomers(customers: Customer[]): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.warn('Erro ao salvar clientes no cache local:', e);
    }
  },

  getDefects(): DefectType[] {
    if (!isBrowser) return DEFAULT_DEFECTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEFECTS);
      if (!data) {
        this.saveDefects(DEFAULT_DEFECTS);
        return DEFAULT_DEFECTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_DEFECTS;
    }
  },

  saveDefects(defects: DefectType[]): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify(defects));
    } catch (e) {
      console.warn('Erro ao salvar defeitos no cache local:', e);
    }
  },

  getComplaints(): Complaint[] {
    if (!isBrowser) return DEFAULT_COMPLAINTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (!data) {
        this.saveComplaints(DEFAULT_COMPLAINTS);
        return DEFAULT_COMPLAINTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_COMPLAINTS;
    }
  },

  saveComplaints(complaints: Complaint[]): void {
    if (!isBrowser) return;
    try {
      const safeComplaints = complaints.map(c => ({
        ...c,
        photos: c.photos?.map(p => ({
          ...p,
          url: p.url && p.url.startsWith('data:') && p.url.length > 2000 ? '' : p.url
        }))
      }));
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(safeComplaints));
    } catch (e) {
      console.warn('Erro ao salvar reclamações no cache local:', e);
    }
  },

  getConcessions(): ConcessionShipment[] {
    if (!isBrowser) return DEFAULT_CONCESSIONS;
    try {
      // Limpa chave antiga se existir
      if (localStorage.getItem('qualitrack_concessions_v4_concession_feedback')) {
        localStorage.removeItem('qualitrack_concessions_v4_concession_feedback');
      }
      const data = localStorage.getItem(STORAGE_KEYS.CONCESSIONS);
      if (!data) {
        this.saveConcessions(DEFAULT_CONCESSIONS);
        return DEFAULT_CONCESSIONS;
      }
      const parsed: ConcessionShipment[] = JSON.parse(data);
      // Remove concessões sintéticas de teste caso tenham sido migradas
      const filtered = parsed.filter(c => !['conc-001', 'conc-002-braskem', 'conc-003', 'conc-004'].includes(c.id));
      if (filtered.length !== parsed.length) {
        this.saveConcessions(filtered);
      }
      return filtered;
    } catch {
      return DEFAULT_CONCESSIONS;
    }
  },

  saveConcessions(concessions: ConcessionShipment[]): void {
    if (!isBrowser) return;
    try {
      // Cria uma versão otimizada para o cache local:
      // Remove URLs de base64 pesadas (> 2KB) para evitar estourar a cota de 5MB do localStorage
      const safeConcessions = concessions.map(c => ({
        ...c,
        photos: c.photos?.map(p => ({
          ...p,
          url: p.url && p.url.startsWith('data:') && p.url.length > 2000 ? '' : p.url
        }))
      }));
      localStorage.setItem(STORAGE_KEYS.CONCESSIONS, JSON.stringify(safeConcessions));
    } catch (e) {
      console.warn('Erro ao salvar concessões no cache local:', e);
    }
  },

  getChatMessages(): AiChatMessage[] {
    if (!isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: AiChatMessage[]): void {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  resetToDefaults(): void {
    if (!isBrowser) return;
    this.saveCustomers(DEFAULT_CUSTOMERS);
    this.saveDefects(DEFAULT_DEFECTS);
    this.saveComplaints(DEFAULT_COMPLAINTS);
    this.saveConcessions(DEFAULT_CONCESSIONS);
    this.saveChatMessages([]);
  },

  exportAllData(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      customers: this.getCustomers(),
      defects: this.getDefects(),
      complaints: this.getComplaints(),
      concessions: this.getConcessions()
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.customers && Array.isArray(parsed.customers)) {
        this.saveCustomers(parsed.customers);
      }
      if (parsed.defects && Array.isArray(parsed.defects)) {
        this.saveDefects(parsed.defects);
      }
      if (parsed.complaints && Array.isArray(parsed.complaints)) {
        this.saveComplaints(parsed.complaints);
      }
      if (parsed.concessions && Array.isArray(parsed.concessions)) {
        this.saveConcessions(parsed.concessions);
      }
      return true;
    } catch (e) {
      console.error('Falha ao importar backup:', e);
      return false;
    }
  },

  getSettings(): QualitySettings {
    if (!isBrowser) return DEFAULT_QUALITY_SETTINGS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_QUALITY_SETTINGS);
        return DEFAULT_QUALITY_SETTINGS;
      }
      const parsed = JSON.parse(data);
      return {
        sackWeightGrams: typeof parsed.sackWeightGrams === 'number' ? parsed.sackWeightGrams : 77.73,
        costPerKg: typeof parsed.costPerKg === 'number' ? parsed.costPerKg : 1.50,
        updatedAt: parsed.updatedAt
      };
    } catch {
      return DEFAULT_QUALITY_SETTINGS;
    }
  },

  saveSettings(settings: QualitySettings): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações no cache local:', e);
    }
  }
};
