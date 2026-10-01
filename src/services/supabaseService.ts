import { Customer, DefectType, Complaint, ConcessionShipment, ToleranceLevel, QualitySettings } from '@/types';
import { supabase } from '@/lib/supabase';
import { DEFAULT_QUALITY_SETTINGS } from './storageService';

let inFlightQualityRequest: Promise<{
  customers: Customer[];
  defects: DefectType[];
  complaints: Complaint[];
  concessions: ConcessionShipment[];
  settings: QualitySettings;
}> | null = null;

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    }
  } catch (e) {
    console.warn('Erro ao obter token de sessão:', e);
  }
  return { 'Content-Type': 'application/json' };
}

export const supabaseService = {
  // --- CARREGAMENTO UNIFICADO AUTENTICADO ---
  async getAllQualityData(): Promise<{
    customers: Customer[];
    defects: DefectType[];
    complaints: Complaint[];
    concessions: ConcessionShipment[];
    settings: QualitySettings;
  }> {
    if (typeof window === 'undefined') {
      return {
        customers: [],
        defects: [],
        complaints: [],
        concessions: [],
        settings: DEFAULT_QUALITY_SETTINGS
      };
    }

    if (inFlightQualityRequest) {
      return inFlightQualityRequest;
    }

    inFlightQualityRequest = (async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/quality', {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }

        return {
          customers: [],
          defects: [],
          complaints: [],
          concessions: [],
          settings: DEFAULT_QUALITY_SETTINGS
        };
      } catch (err) {
        console.warn('Erro ao carregar dados seguros:', err);
        return {
          customers: [],
          defects: [],
          complaints: [],
          concessions: [],
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
      const headers = await getAuthHeaders();
      await fetch('/api/quality', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders();
      await fetch('/api/quality', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders();
      await fetch('/api/quality', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders();
      await fetch('/api/quality', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders();
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'saveConcession', payload: concession })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.item) return json.item;
      }
    } catch (err) {
      console.error('Erro ao salvar concessão via API:', err);
    }
    return concession;
  },

  async saveSettings(settings: { sackWeightGrams: number; costPerKg: number }): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/quality', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'saveSettings', payload: settings })
      });
    } catch (err) {
      console.error('Erro ao salvar configurações via API:', err);
    }
  },

  async deleteConcession(id: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'deleteConcession', payload: { id } })
      });
      return res.ok;
    } catch (err) {
      console.error('Erro ao deletar concessão via API:', err);
      return false;
    }
  },

  async deleteComplaint(id: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'deleteComplaint', payload: { id } })
      });
      return res.ok;
    } catch (err) {
      console.error('Erro ao deletar reclamação via API:', err);
      return false;
    }
  }
};
