import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { DEFAULT_CUSTOMERS, DEFAULT_DEFECTS, DEFAULT_COMPLAINTS, DEFAULT_CONCESSIONS } from '@/data/defaultQualityData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const fetchSupabaseData = Promise.all([
      supabaseServer.from('customers').select('*').order('name', { ascending: true }),
      supabaseServer.from('defects').select('*').order('name', { ascending: true }),
      supabaseServer.from('complaints').select('*').order('date', { ascending: false }),
      supabaseServer.from('concessions').select('*').order('date', { ascending: false })
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timeout')), 6000)
    );

    const [custRes, defRes, compRes, concRes] = await Promise.race([fetchSupabaseData, timeoutPromise]);

    const customers = (custRes.data && custRes.data.length > 0)
      ? custRes.data.map(c => ({
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
        }))
      : DEFAULT_CUSTOMERS;

    const defects = (defRes.data && defRes.data.length > 0)
      ? defRes.data.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          description: d.description || '',
          defaultUnitLoss: Number(d.default_unit_loss) || 15,
          color: d.color || '#06b6d4'
        }))
      : DEFAULT_DEFECTS;

    const complaints = (compRes.data && compRes.data.length > 0)
      ? compRes.data.map(c => ({
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
        }))
      : DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] }));

    const concessions = (concRes.data && concRes.data.length > 0)
      ? concRes.data.map(c => ({
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
        }))
      : DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] }));

    return NextResponse.json({
      success: true,
      data: {
        customers,
        defects,
        complaints,
        concessions
      }
    });
  } catch (error: unknown) {
    console.error('Erro na API /api/quality:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      data: {
        customers: DEFAULT_CUSTOMERS,
        defects: DEFAULT_DEFECTS,
        complaints: DEFAULT_COMPLAINTS.map(c => ({ ...c, photos: [] })),
        concessions: DEFAULT_CONCESSIONS.map(c => ({ ...c, photos: [] }))
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'saveCustomer': {
        const { error } = await supabaseServer.from('customers').upsert({
          id: payload.id,
          name: payload.name,
          code: payload.code,
          segment: payload.segment,
          location: payload.location || payload.cityState || null,
          city_state: payload.cityState || payload.location || null,
          tolerance_ratings: payload.toleranceRatings || {},
          overall_tolerance_score: payload.overallToleranceScore,
          avatar_color: payload.avatarColor,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) throw error;
        return NextResponse.json({ success: true, item: payload });
      }

      case 'saveDefect': {
        const { error } = await supabaseServer.from('defects').upsert({
          id: payload.id,
          name: payload.name,
          category: payload.category,
          description: payload.description,
          default_unit_loss: payload.defaultUnitLoss,
          color: payload.color
        }, { onConflict: 'id' });

        if (error) throw error;
        return NextResponse.json({ success: true, item: payload });
      }

      case 'saveComplaint': {
        const { error } = await supabaseServer.from('complaints').upsert({
          id: payload.id,
          code: payload.code,
          customer_id: payload.customerId,
          customer_name: payload.customerName,
          date: payload.date,
          lot_number: payload.lotNumber,
          defect_type_id: payload.defectTypeId || null,
          defect_type_name: payload.defectTypeName,
          quantity_affected: payload.quantityAffected,
          severity: payload.severity,
          description: payload.description,
          root_cause: payload.rootCause,
          corrective_action: payload.correctiveAction,
          status: payload.status,
          origin: payload.origin,
          cost_impact: payload.costImpact,
          photos: payload.photos || []
        }, { onConflict: 'id' });

        if (error) throw error;
        return NextResponse.json({ success: true, item: payload });
      }

      case 'saveConcession': {
        const { error } = await supabaseServer.from('concessions').upsert({
          id: payload.id,
          code: payload.code,
          customer_id: payload.customerId,
          customer_name: payload.customerName,
          customer_number: payload.customerNumber || null,
          op_number: payload.opNumber || null,
          date: payload.date,
          lot_number: payload.lotNumber,
          product_name: payload.productName,
          defect_type_id: payload.defectTypeId || null,
          defect_type_name: payload.defectTypeName,
          quantity: payload.quantity,
          severity: payload.severity,
          unit_saved_value: payload.unitSavedValue,
          total_saved_value: payload.totalSavedValue,
          risk_score: payload.riskScore,
          customer_feedback_status: payload.customerFeedbackStatus,
          technical_notes: payload.technicalNotes,
          approved_by: payload.approvedBy,
          photos: payload.photos || []
        }, { onConflict: 'id' });

        if (error) throw error;
        return NextResponse.json({ success: true, item: payload });
      }

      case 'updateCustomerTolerance': {
        const { customerId, toleranceRatings, overallToleranceScore } = payload;
        const { error } = await supabaseServer.from('customers').update({
          tolerance_ratings: toleranceRatings,
          overall_tolerance_score: overallToleranceScore,
          updated_at: new Date().toISOString()
        }).eq('id', customerId);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Ação desconhecida' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Erro no POST /api/quality:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar requisição'
    }, { status: 500 });
  }
}
