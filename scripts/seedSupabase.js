const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ddhqmsszumyyabkvmpqh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHFtc3N6dW15eWFia3ZtcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjg5MzMsImV4cCI6MjEwNDY0NDkzM30.aKNFJtmdjiRzeq0dJE7p0MJ7ewANr8c0vz6R_uj1rO4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('--- Iniciando Seed do PerfilCliente no Supabase ---');
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'defaultQualityData.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');

  const defMatch = content.match(/DEFAULT_DEFECTS: DefectType\[\] = (\[[\s\S]*?\]);\s*export const DEFAULT_CUSTOMERS/);
  const custMatch = content.match(/DEFAULT_CUSTOMERS: Customer\[\] = (\[[\s\S]*?\]);\s*export const DEFAULT_COMPLAINTS/);
  const compMatch = content.match(/DEFAULT_COMPLAINTS: Complaint\[\] = (\[[\s\S]*?\]);\s*export const DEFAULT_CONCESSIONS/);
  const concMatch = content.match(/DEFAULT_CONCESSIONS: ConcessionShipment\[\] = (\[[\s\S]*?\]);/);

  if (!defMatch || !custMatch || !compMatch || !concMatch) {
    throw new Error('Falha ao ler dados de defaultQualityData.ts');
  }

  const defects = JSON.parse(defMatch[1]);
  const customers = JSON.parse(custMatch[1]);
  const complaints = JSON.parse(compMatch[1]);
  const concessions = JSON.parse(concMatch[1]);

  console.log(`Lendo catálogo: ${defects.length} defeitos, ${customers.length} clientes, ${complaints.length} reclamações, ${concessions.length} concessões.`);

  // 1. Defeitos
  console.log('\n[1/4] Gravando Catálogo de Defeitos no Supabase...');
  const mappedDefects = defects.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    description: d.description,
    default_unit_loss: d.defaultUnitLoss,
    color: d.color
  }));

  const { error: defErr } = await supabase.from('defects').upsert(mappedDefects, { onConflict: 'id' });
  if (defErr) {
    console.error('Erro ao gravar defeitos:', defErr);
  } else {
    console.log(`✅ ${mappedDefects.length} defeitos gravados com sucesso.`);
  }

  // 2. Clientes
  console.log('\n[2/4] Gravando 114 Clientes Reais do ERP no Supabase...');
  const mappedCustomers = customers.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    segment: c.segment || null,
    location: c.location || c.cityState || null,
    city_state: c.cityState || c.location || null,
    tolerance_ratings: c.toleranceRatings || {},
    overall_tolerance_score: c.overallToleranceScore || 70,
    avatar_color: c.avatarColor || 'from-cyan-500 to-blue-600'
  }));

  for (let i = 0; i < mappedCustomers.length; i += 40) {
    const chunk = mappedCustomers.slice(i, i + 40);
    const { error: custErr } = await supabase.from('customers').upsert(chunk, { onConflict: 'id' });
    if (custErr) {
      console.error(`Erro ao gravar lote de clientes (${i} a ${i + chunk.length}):`, custErr);
    }
  }
  console.log(`✅ ${mappedCustomers.length} clientes gravados com sucesso.`);

  // 3. Reclamações (eliminando fotos genéricas)
  console.log('\n[3/4] Gravando 181 Reclamações SAC do ERP (sem fotos genéricas)...');
  const mappedComplaints = complaints.map(comp => ({
    id: comp.id,
    code: comp.code,
    customer_id: comp.customerId,
    customer_name: comp.customerName,
    date: comp.date,
    lot_number: comp.lotNumber,
    defect_type_id: comp.defectTypeId,
    defect_type_name: comp.defectTypeName,
    quantity_affected: comp.quantityAffected || 0,
    severity: comp.severity || 'moderada',
    description: comp.description || null,
    root_cause: comp.rootCause || null,
    corrective_action: comp.correctiveAction || null,
    status: comp.status || 'aberta',
    origin: comp.origin || 'sac_manual',
    cost_impact: comp.costImpact || 0,
    photos: [] // Sem fotos genéricas
  }));

  for (let i = 0; i < mappedComplaints.length; i += 40) {
    const chunk = mappedComplaints.slice(i, i + 40);
    const { error: compErr } = await supabase.from('complaints').upsert(chunk, { onConflict: 'id' });
    if (compErr) {
      console.error(`Erro ao gravar lote de reclamações (${i} a ${i + chunk.length}):`, compErr);
    }
  }
  console.log(`✅ ${mappedComplaints.length} reclamações gravadas com sucesso.`);

  // 4. Concessões / Envios
  console.log('\n[4/4] Gravando Concessões de Envio no Supabase...');
  const mappedConcessions = concessions.map(conc => ({
    id: conc.id,
    code: conc.code,
    customer_id: conc.customerId,
    customer_name: conc.customerName,
    customer_number: conc.customerNumber || null,
    op_number: conc.opNumber || null,
    date: conc.date,
    lot_number: conc.lotNumber,
    product_name: conc.productName || 'Sacaria',
    defect_type_id: conc.defectTypeId,
    defect_type_name: conc.defectTypeName,
    quantity: conc.quantity || 0,
    severity: conc.severity || 'leve',
    unit_saved_value: conc.unitSavedValue || 0.116595,
    total_saved_value: conc.totalSavedValue || 0,
    risk_score: conc.riskScore || 'baixo',
    customer_feedback_status: conc.customerFeedbackStatus || 'em_transito',
    technical_notes: conc.technicalNotes || null,
    approved_by: conc.approvedBy || 'Mauricio Grigol (Qualidade)',
    photos: [] // Sem fotos genéricas
  }));

  if (mappedConcessions.length > 0) {
    const { error: concErr } = await supabase.from('concessions').upsert(mappedConcessions, { onConflict: 'id' });
    if (concErr) {
      console.error('Erro ao gravar concessões:', concErr);
    } else {
      console.log(`✅ ${mappedConcessions.length} concessões gravadas com sucesso.`);
    }
  }

  console.log('\n🎉 Seed concluído com sucesso no Supabase!');
}

runSeed().catch(err => {
  console.error('Erro fatal no seed:', err);
  process.exit(1);
});
