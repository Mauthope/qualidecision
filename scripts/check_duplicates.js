const fs = require('fs');
const n = JSON.parse(fs.readFileSync('novos_dados.json'));
const b = JSON.parse(fs.readFileSync('scratch/backup_supabase_2026-09-24T18-14-15-530Z.json'));

const atendMap = new Map();
n.forEach(r => {
  const at = r.NUM_ATENDIMENTO;
  if (!atendMap.has(at)) atendMap.set(at, []);
  atendMap.get(at).push(r);
});

let duplicates = 0;
atendMap.forEach((list, at) => {
  if (list.length > 1) {
    duplicates++;
    if (duplicates <= 5) {
      console.log(`NUM_ATENDIMENTO ${at} aparece ${list.length} vezes no novos_dados.json:`);
      list.forEach(item => {
        console.log(`  OP: ${item.NUMERO_OP}, Evidência: ${item.DATA_EVIDENCIA}, Cliente: ${item.RAZAO_SOCIAL}`);
      });
    }
  }
});
console.log(`Total de NUM_ATENDIMENTO que se repetem em anos diferentes no novos_dados.json: ${duplicates}`);

// Agora vamos verificar a sobreposição exata com as 181 reclamações atuais do Supabase
// Chave única real: NUMERO_OP + NOME_DO_CLIENTE + PROBLEMA + DATA_EVIDENCIA
function norm(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').trim();
}

const existingMap = new Map();
b.tables.complaints.forEach(c => {
  // chave: op + cliente
  const key = `${(c.op_number || '').trim()}|${norm(c.customer_name)}`;
  existingMap.set(key, c);
});

let exactMatches = [];
let trueNewItems = [];

n.forEach(r => {
  const op = (r.NUMERO_OP || '').trim();
  const clientNorm = norm(r.RAZAO_SOCIAL);
  const key = `${op}|${clientNorm}`;
  if (existingMap.has(key)) {
    exactMatches.push({ newRow: r, existing: existingMap.get(key) });
  } else {
    trueNewItems.push(r);
  }
});

console.log(`\n--- CONFRONTO COM O SUPABASE ATUAL ---`);
console.log(`Reclamações que JÁ EXISTEM exatamente no Supabase (mesma OP + Cliente): ${exactMatches.length}`);
console.log(`Reclamações que são GENUINAMENTE NOVAS: ${trueNewItems.length}`);
if (exactMatches.length > 0) {
  console.log(`Exemplos de registros já existentes:`);
  exactMatches.slice(0, 5).forEach(m => {
    console.log(`  OP: ${m.newRow.NUMERO_OP} | Cliente: ${m.newRow.RAZAO_SOCIAL} | Existente no Banco como: ${m.existing.code} (${m.existing.date})`);
  });
}
