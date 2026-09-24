const fs = require('fs');
const b = JSON.parse(fs.readFileSync('scratch/backup_supabase_2026-09-24T18-14-15-530Z.json'));
const defMap = new Map();
b.tables.complaints.forEach(c => {
  defMap.set(c.defect_type_name, c.defect_type_id);
});
console.log('Mapeamentos de Defeitos já usados nas reclamações:', Object.fromEntries(defMap));
