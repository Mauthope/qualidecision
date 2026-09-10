import { supabase } from '@/lib/supabase';
import { Customer, DefectType, Complaint, ConcessionShipment, ToleranceLevel } from '@/types';
import { DEFAULT_CUSTOMERS, DEFAULT_DEFECTS, DEFAULT_COMPLAINTS, DEFAULT_CONCESSIONS } from '@/data/defaultQualityData';

export const supabaseService = {
  // --- DEFECTS ---
  async getDefects(): Promise<DefectType[]> {
    try {
      const { data, error } = await supabase
        .from('defects')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Usando catálogo local de defeitos:', error?.message);
        return DEFAULT_DEFECTS;
      }

      return data.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        description: d.description || '',
        defaultUnitLoss: Number(d.default_unit_loss) || 15,
        color: d.color || '#06b6d4'
      }));
    } catch (err) {
      console.error('Erro ao buscar defeitos no Supabase:', err);
      return DEFAULT_DEFECTS;
    }
  },

  async saveDefect(defect: DefectType): Promise<DefectType> {
    try {
      const { error } = await supabase.from('defects').upsert({
        id: defect.id,
        name: defect.name,
        category: defect.category,
        description: defect.description,
        default_unit_loss: defect.defaultUnitLoss,
        color: defect.color
      }, { onConflict: 'id' });

      if (error) console.error('Erro ao salvar defeito no Supabase:', error);
    } catch (err) {
      console.error('Erro ao conectar ao Supabase para defeito:', err);
    }
    return defect;
  },

  // --- CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Usando catálogo local de clientes:', error?.message);
        return DEFAULT_CUSTOMERS;
      }

      return data.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        segment: c.segment || 'Sacaria e Big Bags',
        location: c.location || c.city_state || undefined,
        cityState: c.city_state || c.location || undefined,
        toleranceRatings: c.tolerance_ratings || {},
        overallToleranceScore: Number(c.overall_tolerance_score) || 70,
        avatarColor: c.avatar_color || 'from-cyan-500 to-blue-600',
        createdAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-01-01'
      }));
    } catch (err) {
      console.error('Erro ao buscar clientes no Supabase:', err);
      return DEFAULT_CUSTOMERS;
    }
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    try {
      const { error } = await supabase.from('customers').upsert({
        id: customer.id,
        name: customer.name,
        code: customer.code,
        segment: customer.segment,
        location: customer.location || customer.cityState || null,
        city_state: customer.cityState || customer.location || null,
        tolerance_ratings: customer.toleranceRatings || {},
        overall_tolerance_score: customer.overallToleranceScore,
        avatar_color: customer.avatarColor,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) console.error('Erro ao salvar cliente no Supabase:', error);
    } catch (err) {
      console.error('Erro ao conectar ao Supabase para cliente:', err);
    }
    return customer;
  },

  async updateCustomerTolerance(
    customerId: string,
    toleranceRatings: Record<string, { level: ToleranceLevel; notes?: string }>,
    overallToleranceScore: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('customers').update({
        tolerance_ratings: toleranceRatings,
        overall_tolerance_score: overallToleranceScore,
        updated_at: new Date().toISOString()
      }).eq('id', customerId);

      if (error) console.error('Erro ao atualizar tolerância no Supabase:', error);
    } catch (err) {
      console.error('Erro ao salvar tolerância no Supabase:', err);
    }
  },

  // --- COMPLAINTS ---
  async getComplaints(): Promise<Complaint[]> {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('Usando catálogo local de reclamações:', error?.message);
        return DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] }));
      }

      return data.map(c => ({
        id: c.id,
        code: c.code,
        customerId: c.customer_id,
        customerName: c.customer_name,
        date: c.date,
        lotNumber: c.lot_number,
        defectTypeId: c.defect_type_id || '',
        defectTypeName: c.defect_type_name,
        quantityAffected: Number(c.quantity_affected) || 0,
        severity: c.severity || 'moderada',
        description: c.description || '',
        rootCause: c.root_cause || '',
        correctiveAction: c.corrective_action || '',
        status: c.status || 'aberta',
        origin: c.origin || 'sac_manual',
        costImpact: Number(c.cost_impact) || 0,
        photos: Array.isArray(c.photos) ? c.photos : []
      }));
    } catch (err) {
      console.error('Erro ao buscar reclamações no Supabase:', err);
      return DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] }));
    }
  },

  async saveComplaint(complaint: Complaint): Promise<Complaint> {
    try {
      const { error } = await supabase.from('complaints').upsert({
        id: complaint.id,
        code: complaint.code,
        customer_id: complaint.customerId,
        customer_name: complaint.customerName,
        date: complaint.date,
        lot_number: complaint.lotNumber,
        defect_type_id: complaint.defectTypeId || null,
        defect_type_name: complaint.defectTypeName,
        quantity_affected: complaint.quantityAffected,
        severity: complaint.severity,
        description: complaint.description,
        root_cause: complaint.rootCause,
        corrective_action: complaint.correctiveAction,
        status: complaint.status,
        origin: complaint.origin,
        cost_impact: complaint.costImpact,
        photos: complaint.photos || []
      }, { onConflict: 'id' });

      if (error) console.error('Erro ao salvar reclamação no Supabase:', error);
    } catch (err) {
      console.error('Erro ao conectar ao Supabase para reclamação:', err);
    }
    return complaint;
  },

  // --- CONCESSIONS ---
  async getConcessions(): Promise<ConcessionShipment[]> {
    try {
      const { data, error } = await supabase
        .from('concessions')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) {
        console.warn('Usando catálogo local de concessões:', error?.message);
        return DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] }));
      }

      return data.map(c => ({
        id: c.id,
        code: c.code,
        customerId: c.customer_id,
        customerName: c.customer_name,
        customerNumber: c.customer_number || undefined,
        opNumber: c.op_number || undefined,
        date: c.date,
        lotNumber: c.lot_number,
        productName: c.product_name || 'Sacaria',
        defectTypeId: c.defect_type_id || '',
        defectTypeName: c.defect_type_name,
        quantity: Number(c.quantity) || 0,
        severity: c.severity || 'leve',
        unitSavedValue: Number(c.unit_saved_value) || 0.116595,
        totalSavedValue: Number(c.total_saved_value) || 0,
        riskScore: c.risk_score || 'baixo',
        customerFeedbackStatus: c.customer_feedback_status || 'em_transito',
        technicalNotes: c.technical_notes || '',
        approvedBy: c.approved_by || 'Mauricio Grigol (Qualidade)',
        photos: Array.isArray(c.photos) ? c.photos : []
      }));
    } catch (err) {
      console.error('Erro ao buscar concessões no Supabase:', err);
      return DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] }));
    }
  },

  async saveConcession(concession: ConcessionShipment): Promise<ConcessionShipment> {
    try {
      const { error } = await supabase.from('concessions').upsert({
        id: concession.id,
        code: concession.code,
        customer_id: concession.customerId,
        customer_name: concession.customerName,
        customer_number: concession.customerNumber || null,
        op_number: concession.opNumber || null,
        date: concession.date,
        lot_number: concession.lotNumber,
        product_name: concession.productName,
        defect_type_id: concession.defectTypeId || null,
        defect_type_name: concession.defectTypeName,
        quantity: concession.quantity,
        severity: concession.severity,
        unit_saved_value: concession.unitSavedValue,
        total_saved_value: concession.totalSavedValue,
        risk_score: concession.riskScore,
        customer_feedback_status: concession.customerFeedbackStatus,
        technical_notes: concession.technicalNotes,
        approved_by: concession.approvedBy,
        photos: concession.photos || []
      }, { onConflict: 'id' });

      if (error) console.error('Erro ao salvar concessão no Supabase:', error);
    } catch (err) {
      console.error('Erro ao conectar ao Supabase para concessão:', err);
    }
    return concession;
  }
};
