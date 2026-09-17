import { Customer, DefectType, Complaint, ConcessionShipment, ToleranceLevel, QualitySettings } from '@/types';
import { DEFAULT_CUSTOMERS, DEFAULT_DEFECTS, DEFAULT_COMPLAINTS, DEFAULT_CONCESSIONS } from '@/data/defaultQualityData';
import { DEFAULT_QUALITY_SETTINGS } from './storageService';

let inFlightQualityRequest: Promise<{
  customers: Customer[];
  defects: DefectType[];
  complaints: Complaint[];
  concessions: ConcessionShipment[];
  settings: QualitySettings;
}> | null = null;

export const supabaseService = {
  // --- CARREGAMENTO UNIFICADO (1 ÚNICA REQUISIÇÃO AO SERVIDOR COM DEDUPLICAÇÃO) ---
  async getAllQualityData(): Promise<{
    customers: Customer[];
    defects: DefectType[];
    complaints: Complaint[];
    concessions: ConcessionShipment[];
    settings: QualitySettings;
  }> {
    if (typeof window === 'undefined') {
      return {
        customers: DEFAULT_CUSTOMERS,
        defects: DEFAULT_DEFECTS,
        complaints: DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] })),
        concessions: DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] })),
        settings: DEFAULT_QUALITY_SETTINGS
      };
    }

    if (inFlightQualityRequest) {
      return inFlightQualityRequest;
    }

    inFlightQualityRequest = (async () => {
      try {
        const response = await fetch('/api/quality', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }

        return {
          customers: DEFAULT_CUSTOMERS,
          defects: DEFAULT_DEFECTS,
          complaints: DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] })),
          concessions: DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] })),
          settings: DEFAULT_QUALITY_SETTINGS
        };
      } catch (err) {
        console.warn('Fallback para dados padrão:', err);
        return {
          customers: DEFAULT_CUSTOMERS,
          defects: DEFAULT_DEFECTS,
          complaints: DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] })),
          concessions: DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] })),
          settings: DEFAULT_QUALITY_SETTINGS
        };
      } finally {
        inFlightQualityRequest = null;
      }
    })();

    return inFlightQualityRequest;
  },

  async getDefects(): Promise<DefectType[]> {
    const data = await this.getAllQualityData();
    return data.defects;
  },

  async saveDefect(defect: DefectType): Promise<DefectType> {
    try {
      await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveDefect', payload: defect })
      });
    } catch (err) {
      console.error('Erro ao salvar defeito via API:', err);
    }
    return defect;
  },

  async getCustomers(): Promise<Customer[]> {
    const data = await this.getAllQualityData();
    return data.customers;
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    try {
      await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveCustomer', payload: customer })
      });
    } catch (err) {
      console.error('Erro ao salvar cliente via API:', err);
    }
    return customer;
  },

  async updateCustomerTolerance(
    customerId: string,
    toleranceRatings: Record<string, { level: ToleranceLevel; notes?: string }>,
    overallToleranceScore: number
  ): Promise<void> {
    try {
      await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCustomerTolerance',
          payload: { customerId, toleranceRatings, overallToleranceScore }
        })
      });
    } catch (err) {
      console.error('Erro ao salvar tolerância via API:', err);
    }
  },

  async getComplaints(): Promise<Complaint[]> {
    const data = await this.getAllQualityData();
    return data.complaints;
  },

  async saveComplaint(complaint: Complaint): Promise<Complaint> {
    try {
      await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveComplaint', payload: complaint })
      });
    } catch (err) {
      console.error('Erro ao salvar reclamação via API:', err);
    }
    return complaint;
  },

  async getConcessions(): Promise<ConcessionShipment[]> {
    const data = await this.getAllQualityData();
    return data.concessions;
  },

  async saveConcession(concession: ConcessionShipment): Promise<ConcessionShipment> {
    try {
      await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveConcession', payload: concession })
      });
    } catch (err) {
      console.error('Erro ao salvar concessão via API:', err);
    }
    return concession;
  },

  async saveSettings(settings: QualitySettings): Promise<void> {
    try {
      await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSettings', payload: settings })
      });
    } catch (err) {
      console.error('Erro ao salvar configurações no Supabase via API:', err);
    }
  }
};

