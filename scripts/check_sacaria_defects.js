const fs = require('fs');
const n = JSON.parse(fs.readFileSync('novos_dados.json'));
const b = JSON.parse(fs.readFileSync('scratch/backup_supabase_2026-09-24T18-14-15-530Z.json'));

const novosSacaria = n.filter(r => (r.DESCRICAO || '').trim().toUpperCase() === 'SACARIA');

const problemas = {};
novosSacaria.forEach(r => {
  const p = (r.PROBLEMA || '').trim();
  problemas[p] = (problemas[p] || 0) + 1;
});

console.log('Problemas em Sacaria no novo arquivo:');
console.log(problemas);

const existingDefects = b.tables.defects;
console.log('\nTotal de defeitos cadastrados no Supabase:', existingDefects.length);
console.log('Exemplos de defeitos:', existingDefects.slice(0, 10).map(d => ({ id: d.id, name: d.name })));
