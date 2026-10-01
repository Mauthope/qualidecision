import { NextResponse } from 'next/server';
import { supabaseServer, createUserSupabaseClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { authenticated: false, error: 'Token de autenticação ausente', status: 401, token: '', userDb: supabaseServer };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { authenticated: false, error: 'Formato de token inválido', status: 401, token: '', userDb: supabaseServer };
  }

  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) {
    return { authenticated: false, error: 'Sessão inválida ou expirada', status: 401, token: '', userDb: supabaseServer };
  }

  // Cliente autenticado com a identidade (JWT) do usuário para respeitar RLS e triggers
  const userDb = createUserSupabaseClient(token);

  const { data: profile } = await userDb
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    authenticated: true,
    user,
    token,
    userDb,
    profile: profile || {
      id: user.id,
      email: user.email || '',
      full_name: (user.user_metadata as any)?.full_name || user.email?.split('@')[0] || 'Usuário',
      role: 'visualizador'
    }
  };
}

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
    }

    const { userDb } = auth;

    const fetchSupabaseData = Promise.all([
      userDb.from('customers').select('*').order('name', { ascending: true }),
      userDb.from('defects').select('*').order('name', { ascending: true }),
      userDb.from('complaints').select('*').order('date', { ascending: false }),
      userDb.from('concessions').select('*').order('date', { ascending: false }),
      userDb.from('quality_settings').select('*').eq('id', 'default').maybeSingle()
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timeout')), 8000)
    );

    const [custRes, defRes, compRes, concRes, settingsRes] = await Promise.race([fetchSupabaseData, timeoutPromise]);

    const customers = (custRes.data || []).map(c => ({
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

    const defects = (defRes.data || []).map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      description: d.description || '',
      defaultUnitLoss: Number(d.default_unit_loss) || 15,
      color: d.color || '#06b6d4'
    }));

    const complaints = (compRes.data || []).map(c => ({
      id: c.id,
      code: c.code,
      customerId: c.customer_id,
      customerName: c.customer_name,
      customerNumber: c.customer_number || undefined,
      date: c.date,
      lotNumber: c.lot_number,
      opNumber: c.op_number || (c.lot_number ? c.lot_number.replace(/^OP\s*/i, '') : undefined),
      bales: Array.isArray(c.bales) ? c.bales : [],
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

    const concessions = (concRes.data || [])
      .filter(c => !['conc-001', 'conc-002-braskem', 'conc-003', 'conc-004'].includes(c.id))
      .map(c => ({
        id: c.id,
        code: c.code,
        customerId: c.customer_id,
        customerName: c.customer_name,
        customerNumber: c.customer_number || undefined,
        opNumber: c.op_number || undefined,
        date: c.date,
        lotNumber: c.lot_number,
        bales: Array.isArray(c.bales) ? c.bales : [],
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
        approvedBy: c.approved_by || 'Colaborador Qualidade',
        photos: Array.isArray(c.photos) ? c.photos : []
      }));

    const settings = (settingsRes && settingsRes.data)
      ? {
          sackWeightGrams: Number(settingsRes.data.sack_weight_grams) || 77.73,
          costPerKg: Number(settingsRes.data.cost_per_kg) || 1.50,
          updatedAt: settingsRes.data.updated_at
        }
      : {
          sackWeightGrams: 77.73,
          costPerKg: 1.50
        };

    return NextResponse.json({
      success: true,
      data: {
        customers,
        defects,
        complaints,
        concessions,
        settings
      }
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: unknown) {
    console.error('Erro na API /api/quality:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
    }

    const userRole = auth.profile?.role || 'visualizador';
    const canEdit = ['editor', 'admin'].includes(userRole);
    const isAdmin = userRole === 'admin';

    const body = await req.json();
    const { action, payload } = body;
    const { userDb } = auth;

    // Ações de alteração de dados exigem papel de editor ou admin
    if (!canEdit) {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado: seu perfil não tem permissão para cadastrar ou modificar registros.'
      }, { status: 403 });
    }

    switch (action) {
      case 'saveCustomer': {
        const { error } = await userDb.from('customers').upsert({
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
        const { error } = await userDb.from('defects').upsert({
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
        const { error } = await userDb.from('complaints').upsert({
          id: payload.id,
          code: payload.code,
          customer_id: payload.customerId,
          customer_name: payload.customerName,
          customer_number: payload.customerNumber || null,
          op_number: payload.opNumber || null,
          date: payload.date,
          lot_number: payload.lotNumber,
          bales: payload.bales || [],
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
        // Grava o autor real a partir da sessão autenticada, nunca de texto arbitrário do cliente
        const authorName = auth.profile?.full_name || auth.user?.email || 'Colaborador Qualidade';

        const { error } = await userDb.from('concessions').upsert({
          id: payload.id,
          code: payload.code,
          customer_id: payload.customerId,
          customer_name: payload.customerName,
          customer_number: payload.customerNumber || null,
          op_number: payload.opNumber || null,
          date: payload.date,
          lot_number: payload.lotNumber,
          bales: payload.bales || [],
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
          approved_by: authorName,
          photos: payload.photos || []
        }, { onConflict: 'id' });

        if (error) throw error;
        return NextResponse.json({ success: true, item: { ...payload, approvedBy: authorName } });
      }

      case 'updateCustomerTolerance': {
        const { customerId, toleranceRatings, overallToleranceScore } = payload;
        const { error } = await userDb.from('customers').update({
          tolerance_ratings: toleranceRatings,
          overall_tolerance_score: overallToleranceScore,
          updated_at: new Date().toISOString()
        }).eq('id', customerId);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'saveSettings': {
        if (!isAdmin) {
          return NextResponse.json({
            success: false,
            error: 'Apenas administradores podem calibrar fórmulas industriais e custos de refugo.'
          }, { status: 403 });
        }

        const { sackWeightGrams, costPerKg } = payload;
        const { error } = await userDb.from('quality_settings').upsert({
          id: 'default',
          sack_weight_grams: Number(sackWeightGrams) || 77.73,
          cost_per_kg: Number(costPerKg) || 1.50,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'deleteConcession': {
        if (!isAdmin) {
          return NextResponse.json({
            success: false,
            error: 'Apenas administradores podem excluir concessões registradas.'
          }, { status: 403 });
        }

        const { id } = payload;
        if (!id) {
          return NextResponse.json({ success: false, error: 'ID da concessão não informado' }, { status: 400 });
        }
        const { error } = await userDb.from('concessions').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, id });
      }

      case 'deleteComplaint': {
        if (!isAdmin) {
          return NextResponse.json({
            success: false,
            error: 'Apenas administradores podem excluir reclamações registradas.'
          }, { status: 403 });
        }

        const { id } = payload;
        if (!id) {
          return NextResponse.json({ success: false, error: 'ID da reclamação não informado' }, { status: 400 });
        }
        const { error } = await userDb.from('complaints').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, id });
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
