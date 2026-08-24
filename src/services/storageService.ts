import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage } from '@/types';
import { DEFAULT_CUSTOMERS, DEFAULT_DEFECTS, DEFAULT_COMPLAINTS, DEFAULT_CONCESSIONS } from '@/data/defaultQualityData';

const STORAGE_KEYS = {
  CUSTOMERS: 'qualitrack_customers_v3_exact_erp',
  DEFECTS: 'qualitrack_defects_v3_exact_erp',
  COMPLAINTS: 'qualitrack_complaints_v3_exact_erp',
  CONCESSIONS: 'qualitrack_concessions_v3_exact_erp',
  CHAT_MESSAGES: 'qualitrack_chat_v3_exact_erp'
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
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    window.dispatchEvent(new Event('qualitrack_storage_update'));
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
    localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify(defects));
    window.dispatchEvent(new Event('qualitrack_storage_update'));
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
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    window.dispatchEvent(new Event('qualitrack_storage_update'));
  },

  getConcessions(): ConcessionShipment[] {
    if (!isBrowser) return DEFAULT_CONCESSIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONCESSIONS);
      if (!data) {
        this.saveConcessions(DEFAULT_CONCESSIONS);
        return DEFAULT_CONCESSIONS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CONCESSIONS;
    }
  },

  saveConcessions(concessions: ConcessionShipment[]): void {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.CONCESSIONS, JSON.stringify(concessions));
    window.dispatchEvent(new Event('qualitrack_storage_update'));
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
  }
};
