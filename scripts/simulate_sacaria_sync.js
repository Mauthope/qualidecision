const fs = require('fs');
const b = JSON.parse(fs.readFileSync('scratch/backup_supabase_2026-09-24T18-14-15-530Z.json'));
const n = JSON.parse(fs.readFileSync('novos_dados.json'));

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

// 1. Existing complaints analysis
const existingComplaints = b.tables.complaints;
const nonSacariaComplaints = existingComplaints.filter(c => {
  const desc = (c.description || '').toUpperCase();
  return desc.includes('(BAG)') || desc.includes('(TECIDOS ESPECIAIS)');
});
const existingSacariaComplaints = existingComplaints.filter(c => {
  const desc = (c.description || '').toUpperCase();
  return !desc.includes('(BAG)') && !desc.includes('(TECIDOS ESPECIAIS)');
});

console.log(`Reclamações existentes no banco: ${existingComplaints.length}`);
console.log(`- Não-sacaria a remover: ${nonSacariaComplaints.length}`);
console.log(`- Sacaria a manter: ${existingSacariaComplaints.length}`);

// 2. Novos dados Sacaria
const novosSacaria = n.filter(r => (r.DESCRICAO || '').trim().toUpperCase() === 'SACARIA');
console.log(`Novos registros de Sacaria: ${novosSacaria.length}`);

// Mapa de duplicatas com as reclamações de sacaria já existentes
const existingKeyMap = new Map();
existingSacariaComplaints.forEach(c => {
  const op = (c.op_number || '').trim();
  const cli = cleanName(c.customer_name);
  existingKeyMap.set(`${op}|${cli}`, c);
});

let jaCadastrados = 0;
let novosAInserir = [];

novosSacaria.forEach(r => {
  const op = (r.NUMERO_OP || '').trim();
  const cli = cleanName(r.RAZAO_SOCIAL);
  const key = `${op}|${cli}`;
  if (existingKeyMap.has(key)) {
    jaCadastrados++;
  } else {
    novosAInserir.push(r);
  }
});

console.log(`- Já existentes (não duplicar): ${jaCadastrados}`);
console.log(`- Novos a inserir: ${novosAInserir.length}`);

// Distribuição de anos dos novos a inserir
const anosCount = {};
novosAInserir.forEach(r => {
  const dt = parseDate(r.DATA_EVIDENCIA) || parseDate(r.DATA_FABRICACAO) || '2025-01-01';
  const ano = dt.slice(0, 4);
  anosCount[ano] = (anosCount[ano] || 0) + 1;
});
console.log('Distribuição por ano das novas reclamações a inserir:', anosCount);
