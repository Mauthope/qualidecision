const fs = require('fs');
const b = JSON.parse(fs.readFileSync('scratch/backup_supabase_2026-09-24T18-14-15-530Z.json'));
const n = JSON.parse(fs.readFileSync('novos_dados.json'));

console.log('=== ANÁLISE DO FILTRO EXCLUSIVO DE SACARIA ===');

// 1. novos_dados.json
const novosDescricoes = {};
n.forEach(r => {
  const d = (r.DESCRICAO || '').trim().toUpperCase();
  novosDescricoes[d] = (novosDescricoes[d] || 0) + 1;
});
console.log('\nDistribuição no novos_dados.json:');
console.log(novosDescricoes);

const novosSacaria = n.filter(r => (r.DESCRICAO || '').trim().toUpperCase() === 'SACARIA');
console.log(`\nTotal no novos_dados.json de SACARIA: ${novosSacaria.length} (de ${n.length})`);
const procedentesSacaria = novosSacaria.filter(r => (r.PARECER_TECNICO || '').toUpperCase() === 'PROCEDENTE');
console.log(`- Procedentes Sacaria: ${procedentesSacaria.length}`);
console.log(`- Improcedentes Sacaria: ${novosSacaria.length - procedentesSacaria.length}`);

// 2. Supabase complaints
console.log('\nDistribuição nas Reclamações atuais do Supabase:');
const compTypes = {};
b.tables.complaints.forEach(c => {
  // na descrição ou product_name
  const desc = c.description || '';
  let type = 'OUTROS';
  if (desc.includes('(BAG)')) type = 'BAG';
  else if (desc.includes('(SACARIA)')) type = 'SACARIA';
  else if (desc.includes('(TECIDOS ESPECIAIS)')) type = 'TECIDOS ESPECIAIS';
  compTypes[type] = (compTypes[type] || 0) + 1;
});
console.log(compTypes);

// 3. Supabase concessions
console.log('\nDistribuição nas Concessões atuais do Supabase:');
const concTypes = {};
b.tables.concessions.forEach(c => {
  const p = (c.product_name || 'Desconhecido').toUpperCase();
  concTypes[p] = (concTypes[p] || 0) + 1;
});
console.log(concTypes);

// 4. Clientes únicos de Sacaria
function norm(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();
}

const clientesSacariaNovos = new Set(novosSacaria.map(r => norm(r.RAZAO_SOCIAL)));
console.log(`\nClientes únicos em novos_dados.json (Sacaria): ${clientesSacariaNovos.size}`);
