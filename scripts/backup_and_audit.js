const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ddhqmsszumyyabkvmpqh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHFtc3N6dW15eWFia3ZtcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjg5MzMsImV4cCI6MjEwNDY0NDkzM30.aKNFJtmdjiRzeq0dJE7p0MJ7ewANr8c0vz6R_uj1rO4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAll(table) {
  let allRows = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + step - 1);
    if (error) {
      throw new Error(`Erro ao buscar dados da tabela ${table}: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allRows;
}

async function main() {
  console.log('=== [ETAPA 1] GERANDO BACKUP COMPLETO DO SUPABASE ===');
  
  const [customers, defects, complaints, concessions] = await Promise.all([
    fetchAll('customers'),
    fetchAll('defects'),
    fetchAll('complaints'),
    fetchAll('concessions')
  ]);

  console.log(`Dados atuais no Supabase:`);
  console.log(`- Clientes: ${customers.length}`);
  console.log(`- Defeitos: ${defects.length}`);
  console.log(`- Reclamações (SAC): ${complaints.length}`);
  console.log(`- Concessões (Envios): ${concessions.length}`);

  const backupDir = path.join(__dirname, '..', 'scratch');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_supabase_${timestamp}.json`);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      customers: customers.length,
      defects: defects.length,
      complaints: complaints.length,
      concessions: concessions.length
    },
    tables: {
      customers,
      defects,
      complaints,
      concessions
    }
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Backup salvo com sucesso em: ${backupFile}`);

  console.log('\n=== [ETAPA 2] AUDITORIA E COMPARAÇÃO COM novos_dados.json ===');
  const novosDadosPath = path.join(__dirname, '..', 'novos_dados.json');
  if (!fs.existsSync(novosDadosPath)) {
    throw new Error(`Arquivo não encontrado: ${novosDadosPath}`);
  }

  const rawJson = fs.readFileSync(novosDadosPath, 'utf8');
  const novosDados = JSON.parse(rawJson);
  console.log(`Total de registros no arquivo novos_dados.json: ${novosDados.length}`);

  // Analisar estrutura das colunas
  const sample = novosDados[0];
  console.log('Exemplo de chaves do primeiro registro:', Object.keys(sample));

  // Mapa de Clientes existentes no Supabase
  // Normalizar nome do cliente
  function norm(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const existingCustomersByNorm = new Map();
  customers.forEach(c => {
    existingCustomersByNorm.set(norm(c.name), c);
  });

  // Reclamações existentes indexadas por chaves:
  // 1) id_atendimento (se armazenado ou extraído de lot_number ou description)
  // 2) numero_op + norm(cliente) + data
  const existingComplaintsByOpClient = new Set();
  complaints.forEach(c => {
    const key = `${c.op_number || ''}|${norm(c.customer_name)}|${c.date || ''}`;
    existingComplaintsByOpClient.add(key);
    if (c.lot_number) {
      existingComplaintsByOpClient.add(`lot:${c.lot_number}`);
    }
  });

  // Analisar registros do novo arquivo
  let totalProcedentes = 0;
  let totalImprocedentes = 0;
  let matchedExistingComplaints = 0;
  let newComplaintsToInsert = 0;
  let clientsMatched = new Set();
  let clientsNew = new Set();
  let yearsCount = {};

  novosDados.forEach((row, idx) => {
    const parecer = (row.PARECER_TECNICO || row.parecer_tecnico || '').toUpperCase();
    if (parecer === 'PROCEDENTE') {
      totalProcedentes++;
    } else {
      totalImprocedentes++;
    }

    const clientName = (row.RAZAO_SOCIAL || row.cliente || '').trim();
    const clientKey = norm(clientName);
    if (existingCustomersByNorm.has(clientKey)) {
      clientsMatched.add(clientName);
    } else {
      clientsNew.add(clientName);
    }

    // Extrair ano
    const dataEvidencia = row.DATA_EVIDENCIA || row.data_evidencia || '';
    let year = 'Desconhecido';
    if (dataEvidencia.includes('/')) {
      const parts = dataEvidencia.split('/');
      if (parts.length === 3) year = parts[2];
    } else if (dataEvidencia.includes('-')) {
      const parts = dataEvidencia.split('-');
      if (parts.length === 3) year = parts[0];
    }
    yearsCount[year] = (yearsCount[year] || 0) + 1;

    // Verificar se já existe
    const op = (row.NUMERO_OP || row.numero_op || '').trim();
    const opClientKey = `${op}|${clientKey}|${dataEvidencia}`;
    const numAtendimento = row.NUM_ATENDIMENTO || row.id_atendimento;
    const lotKey = numAtendimento ? `lot:ATEND-${numAtendimento}` : null;

    if (existingComplaintsByOpClient.has(opClientKey) || (lotKey && existingComplaintsByOpClient.has(lotKey))) {
      matchedExistingComplaints++;
    } else {
      newComplaintsToInsert++;
    }
  });

  console.log('\n--- RESULTADO DA AUDITORIA (DRY-RUN) ---');
  console.log(`Total de registros no JSON: ${novosDados.length}`);
  console.log(`- Procedentes: ${totalProcedentes}`);
  console.log(`- Improcedentes: ${totalImprocedentes}`);
  console.log(`\nDistribuição por Ano:`);
  Object.keys(yearsCount).sort().forEach(y => {
    console.log(`  Ano ${y}: ${yearsCount[y]} ocorrências`);
  });

  console.log(`\nCruzamento de Clientes:`);
  console.log(`- Clientes já cadastrados no Supabase reconhecidos: ${clientsMatched.size}`);
  console.log(`- Clientes novos a serem cadastrados: ${clientsNew.size}`);
  if (clientsNew.size > 0) {
    console.log(`  Exemplo de clientes novos:`, Array.from(clientsNew).slice(0, 5));
  }

  console.log(`\nCruzamento de Ocorrências (Anti-Duplicação):`);
  console.log(`- Ocorrências já existentes no Supabase (não serão duplicadas): ${matchedExistingComplaints}`);
  console.log(`- Ocorrências novas a serem inseridas com segurança: ${newComplaintsToInsert}`);

  console.log('\n✅ Auditoria concluída com sucesso!');
}

main().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
