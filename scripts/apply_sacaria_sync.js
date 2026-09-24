const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ddhqmsszumyyabkvmpqh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHFtc3N6dW15eWFia3ZtcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjg5MzMsImV4cCI6MjEwNDY0NDkzM30.aKNFJtmdjiRzeq0dJE7p0MJ7ewANr8c0vz6R_uj1rO4';

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ltda|sa|s\/a|s\.a|eireli|me|epp|cia|filial|matriz)\b/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(str) {
  return cleanName(str).replace(/\s+/g, '-').slice(0, 40);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return dateStr;
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return null;
}

function defectToId(name) {
  return 'def-' + slug(name);
}

async function main() {
  console.log('=== INICIANDO SINCRONIZAÇÃO E UNIFICAÇÃO EXCLUSIVA DE SACARIA ===');

  const backupPath = path.join(__dirname, '..', 'scratch', 'backup_supabase_2026-09-24T18-14-15-530Z.json');
  const b = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const novosDadosPath = path.join(__dirname, '..', 'novos_dados.json');
  const n = JSON.parse(fs.readFileSync(novosDadosPath, 'utf8'));

  // 1. Remover não-sacaria das reclamações existentes no Supabase
  const existingComplaints = b.tables.complaints;
  const nonSacariaComplaints = existingComplaints.filter(c => {
    const desc = (c.description || '').toUpperCase();
    return desc.includes('(BAG)') || desc.includes('(TECIDOS ESPECIAIS)');
  });
  const existingSacariaComplaints = existingComplaints.filter(c => {
    const desc = (c.description || '').toUpperCase();
    return !desc.includes('(BAG)') && !desc.includes('(TECIDOS ESPECIAIS)');
  });

  console.log(`\n[1/5] Limpando ${nonSacariaComplaints.length} reclamações de Bag e Tecidos Especiais do banco ativo...`);
  const nonSacariaIds = nonSacariaComplaints.map(c => c.id);
  for (let i = 0; i < nonSacariaIds.length; i += 30) {
    const batch = nonSacariaIds.slice(i, i + 30);
    const { error: delErr } = await supabase.from('complaints').delete().in('id', batch);
    if (delErr) {
      console.error('Erro ao deletar lote não-sacaria:', delErr);
    }
  }
  console.log(`✅ ${nonSacariaIds.length} reclamações não-sacaria removidas (preservadas no backup). Restaram ${existingSacariaComplaints.length} reclamações de Sacaria.`);

  // 2. Mapeamento e criação de Clientes
  console.log(`\n[2/5] Mapeando clientes e preservando números reais...`);
  const existingCustomers = b.tables.customers;
  const customerMapByCleanName = new Map();
  existingCustomers.forEach(c => {
    customerMapByCleanName.set(cleanName(c.name), c);
  });

  const novosSacaria = n.filter(r => (r.DESCRICAO || '').trim().toUpperCase() === 'SACARIA');
  console.log(`Total de ocorrências de SACARIA no novos_dados.json: ${novosSacaria.length}`);

  // Encontrar o maior código CLI-xxx existente para novos clientes
  let maxCliNum = 0;
  existingCustomers.forEach(c => {
    const match = (c.code || '').match(/CLI-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxCliNum) maxCliNum = num;
    }
  });

  const avatarGradients = [
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-blue-600 to-teal-500'
  ];

  const customersToUpsert = [];
  novosSacaria.forEach(r => {
    const rawName = r.RAZAO_SOCIAL.trim();
    const cKey = cleanName(rawName);
    if (!customerMapByCleanName.has(cKey)) {
      maxCliNum++;
      const newCust = {
        id: 'cli-' + slug(rawName),
        name: rawName,
        code: `CLI-${String(maxCliNum).padStart(3, '0')}`,
        segment: 'Sacaria',
        location: 'Brasil',
        city_state: 'Brasil',
        tolerance_ratings: {},
        overall_tolerance_score: 70,
        avatar_color: avatarGradients[maxCliNum % avatarGradients.length]
      };
      customerMapByCleanName.set(cKey, newCust);
      customersToUpsert.push(newCust);
    }
  });

  if (customersToUpsert.length > 0) {
    console.log(`Cadastrando ${customersToUpsert.length} novos clientes de Sacaria no Supabase...`);
    for (let i = 0; i < customersToUpsert.length; i += 40) {
      const batch = customersToUpsert.slice(i, i + 40);
      const { error: custErr } = await supabase.from('customers').upsert(batch, { onConflict: 'id' });
      if (custErr) console.error('Erro ao inserir novos clientes:', custErr);
    }
    console.log(`✅ ${customersToUpsert.length} novos clientes cadastrados com sucesso.`);
  } else {
    console.log('Todos os clientes já estavam cadastrados!');
  }

  // 3. Cadastrar novos defeitos se necessário
  console.log(`\n[3/5] Garantindo catálogo de Defeitos de Sacaria...`);
  const existingDefectsMap = new Map();
  b.tables.defects.forEach(d => {
    existingDefectsMap.set(d.id, d);
  });

  const defectsToUpsert = [];
  novosSacaria.forEach(r => {
    const p = (r.PROBLEMA || '').trim();
    const dId = defectToId(p);
    if (!existingDefectsMap.has(dId)) {
      const newDef = {
        id: dId,
        name: p,
        category: 'processo',
        description: `Desvio de qualidade referente a ${p}.`,
        default_unit_loss: 20.0,
        color: '#06b6d4'
      };
      existingDefectsMap.set(dId, newDef);
      defectsToUpsert.push(newDef);
    }
  });

  if (defectsToUpsert.length > 0) {
    console.log(`Cadastrando ${defectsToUpsert.length} novos tipos de defeito...`);
    const { error: defErr } = await supabase.from('defects').upsert(defectsToUpsert, { onConflict: 'id' });
    if (defErr) console.error('Erro ao cadastrar defeitos:', defErr);
    else console.log(`✅ ${defectsToUpsert.length} tipos de defeito gravados.`);
  }

  // 4. Inserir Reclamações de Sacaria (sem duplicar as 43 já existentes)
  console.log(`\n[4/5] Processando novas reclamações de Sacaria com separação de ano...`);

  const existingComplaintsKeyMap = new Map();
  existingSacariaComplaints.forEach(c => {
    const op = (c.op_number || '').trim();
    const cli = cleanName(c.customer_name);
    existingComplaintsKeyMap.set(`${op}|${cli}`, c);
  });

  const complaintsToInsert = [];
  let alreadyPresentCount = 0;

  novosSacaria.forEach((r, idx) => {
    const op = (r.NUMERO_OP || '').trim();
    const clientRaw = r.RAZAO_SOCIAL.trim();
    const cKey = cleanName(clientRaw);
    const key = `${op}|${cKey}`;

    if (existingComplaintsKeyMap.has(key)) {
      alreadyPresentCount++;
      return; // Já existe no Supabase, preservar o registro existente!
    }

    const customer = customerMapByCleanName.get(cKey) || {
      id: 'cli-' + slug(clientRaw),
      name: clientRaw,
      code: 'CLI-000'
    };

    const dateEvidencia = parseDate(r.DATA_EVIDENCIA);
    const dateFabricacao = parseDate(r.DATA_FABRICACAO);
    const finalDate = dateEvidencia || dateFabricacao || '2025-01-01';
    const ano = finalDate.slice(0, 4);

    const numAtendimento = r.NUM_ATENDIMENTO || (idx + 1);
    const defectName = (r.PROBLEMA || 'Outros').trim();
    const defectId = defectToId(defectName);
    const quant = r.QUANT_PROBLEMA || 1;

    let severity = 'leve';
    if (quant > 300 || r.DEVOLUCAO === 'Sim') {
      severity = 'severa';
    } else if (quant > 20 || defectName.toLowerCase().includes('rasgando') || defectName.toLowerCase().includes('solda')) {
      severity = 'moderada';
    }

    const complaintCode = `REC-${ano}-${String(numAtendimento).padStart(3, '0')}`;
    const uniqueId = `comp-erp-${ano}-${numAtendimento}-${slug(clientRaw)}`;

    const newComp = {
      id: uniqueId,
      code: complaintCode,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_number: customer.code, // Mantém o número real cadastrado!
      date: finalDate,
      lot_number: `OP ${op}`,
      op_number: op,
      defect_type_id: defectId,
      defect_type_name: defectName,
      quantity_affected: quant,
      severity: severity,
      description: `[Laudo ERP SAC - ${ano}] ${defectName} no setor ${r.NOME_SETOR || 'Geral'}. Quantidade afetada: ${quant} (SACARIA). OP: ${op}. Parecer: ${r.PARECER_TECNICO}.`,
      root_cause: `Apontamento registrado no setor ${r.NOME_SETOR || 'Geral'}.`,
      corrective_action: `Acompanhamento de processo e controle de qualidade para o cliente ${customer.name}.`,
      status: r.DEVOLUCAO === 'Sim' ? 'devolucao_total' : (r.PARECER_TECNICO === 'PROCEDENTE' ? 'resolvida' : 'improcedente'),
      origin: 'erp_sync',
      cost_impact: 0,
      photos: [],
      bales: []
    };

    complaintsToInsert.push(newComp);
    existingComplaintsKeyMap.set(key, newComp);
  });

  console.log(`- Reclamações que já existiam e foram preservadas: ${alreadyPresentCount}`);
  console.log(`- Novas reclamações de Sacaria a gravar: ${complaintsToInsert.length}`);

  for (let i = 0; i < complaintsToInsert.length; i += 40) {
    const chunk = complaintsToInsert.slice(i, i + 40);
    const { error: insErr } = await supabase.from('complaints').upsert(chunk, { onConflict: 'id' });
    if (insErr) {
      console.error(`Erro ao inserir lote de reclamações (${i} a ${i + chunk.length}):`, insErr);
    }
  }
  console.log(`✅ ${complaintsToInsert.length} novas reclamações de Sacaria gravadas no Supabase com sucesso.`);

  // 5. Recalcular Tolerâncias de Clientes com base no universo 100% Sacaria
  console.log(`\n[5/5] Recalculando tolerâncias dos clientes com base nas ocorrências de Sacaria...`);
  const allActiveSacariaComplaints = existingSacariaComplaints.concat(complaintsToInsert);
  console.log(`Total acumulado de reclamações de Sacaria: ${allActiveSacariaComplaints.length}`);

  const complaintsByCustomer = new Map();
  allActiveSacariaComplaints.forEach(c => {
    const cKey = cleanName(c.customer_name);
    if (!complaintsByCustomer.has(cKey)) complaintsByCustomer.set(cKey, []);
    complaintsByCustomer.get(cKey).push(c);
  });

  const updatedCustomers = [];
  customerMapByCleanName.forEach((cust, cKey) => {
    const custComplaints = complaintsByCustomer.get(cKey) || [];
    const defectCounts = {};
    custComplaints.forEach(c => {
      defectCounts[c.defect_type_id] = (defectCounts[c.defect_type_id] || 0) + 1;
    });

    const toleranceRatings = {};
    let totalScore = 0;
    const trackedDefects = ['def-solda-fraca-na-tarja', 'def-refilada', 'def-falhas-impressao', 'def-valvula-colada', 'def-variacao-de-cor', 'def-raspado', 'def-desencaixe'];

    trackedDefects.forEach(dId => {
      const count = defectCounts[dId] || 0;
      let level = 'alta';
      let notes = 'Alta flexibilidade histórica em Sacaria. Sem registros procedentes.';
      let score = 100;

      if (count >= 3) {
        level = 'intolerante';
        notes = `Rejeição crítica (${count} ocorrências no histórico de Sacaria).`;
        score = 10;
      } else if (count === 2) {
        level = 'baixa';
        notes = `Cliente sensível a este desvio (${count} ocorrências registradas).`;
        score = 40;
      } else if (count === 1) {
        level = 'moderada';
        notes = `Aceita com ressalvas desde que o desvio seja leve.`;
        score = 70;
      }

      toleranceRatings[dId] = { level, notes };
      totalScore += score;
    });

    const overallScore = Math.round(totalScore / trackedDefects.length);

    updatedCustomers.push({
      id: cust.id,
      name: cust.name,
      code: cust.code, // Mantém intocado o número real
      segment: 'Sacaria',
      location: cust.location || 'Brasil',
      city_state: cust.city_state || 'Brasil',
      tolerance_ratings: toleranceRatings,
      overall_tolerance_score: overallScore,
      avatar_color: cust.avatar_color || 'from-cyan-500 to-blue-600'
    });
  });

  for (let i = 0; i < updatedCustomers.length; i += 40) {
    const chunk = updatedCustomers.slice(i, i + 40);
    const { error: updErr } = await supabase.from('customers').upsert(chunk, { onConflict: 'id' });
    if (updErr) console.error(`Erro ao atualizar tolerâncias de clientes (${i}):`, updErr);
  }

  console.log(`✅ Tolerâncias de ${updatedCustomers.length} clientes recalculadas com foco exclusivo em Sacaria!`);
  console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM TOTAL SUCESSO!');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
