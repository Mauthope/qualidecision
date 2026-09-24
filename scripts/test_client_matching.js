const fs = require('fs');
const b = JSON.parse(fs.readFileSync('scratch/backup_supabase_2026-09-24T18-14-15-530Z.json'));
const n = JSON.parse(fs.readFileSync('novos_dados.json'));

const novosSacaria = n.filter(r => (r.DESCRICAO || '').trim().toUpperCase() === 'SACARIA');

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

const existingCustomers = b.tables.customers;
const existingMap = new Map();
existingCustomers.forEach(c => {
  existingMap.set(cleanName(c.name), c);
});

let matchedCount = 0;
let newCount = 0;
const matchedClients = [];
const newClients = [];

const uniqueNovosNomes = [...new Set(novosSacaria.map(r => r.RAZAO_SOCIAL.trim()))];

uniqueNovosNomes.forEach(nome => {
  const key = cleanName(nome);
  if (existingMap.has(key)) {
    matchedCount++;
    matchedClients.push({ novo: nome, existente: existingMap.get(key).name, code: existingMap.get(key).code });
  } else {
    newCount++;
    newClients.push(nome);
  }
});

console.log(`Clientes únicos de Sacaria no arquivo: ${uniqueNovosNomes.length}`);
console.log(`Reconhecidos no banco atual: ${matchedCount}`);
console.log(`Novos clientes a adicionar: ${newCount}`);
console.log('\nExemplos de Clientes Reconhecidos e seus códigos mantidos:');
matchedClients.slice(0, 10).forEach(m => {
  console.log(`  "${m.novo}" -> Mantém cadastro de "${m.existente}" [Código: ${m.code}]`);
});
console.log('\nExemplos de Novos Clientes:');
newClients.slice(0, 10).forEach(n => {
  console.log(`  + "${n}"`);
});
