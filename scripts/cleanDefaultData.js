const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'defaultQualityData.ts');
let content = fs.readFileSync(dataPath, 'utf-8');

// Parse data safely
const defMatch = content.match(/DEFAULT_DEFECTS: DefectType\[\] = (\[[\s\S]*?\]);\s*export const DEFAULT_CUSTOMERS/);
const custMatch = content.match(/DEFAULT_CUSTOMERS: Customer\[\] = (\[[\s\S]*?\]);\s*export const DEFAULT_COMPLAINTS/);
const compMatch = content.match(/DEFAULT_COMPLAINTS: Complaint\[\] = (\[[\s\S]*?\]);\s*export const DEFAULT_CONCESSIONS/);
const concMatch = content.match(/DEFAULT_CONCESSIONS: ConcessionShipment\[\] = (\[[\s\S]*?\]);/);

if (defMatch && custMatch && compMatch && concMatch) {
  const defects = JSON.parse(defMatch[1]);
  const customers = JSON.parse(custMatch[1]);
  const complaints = JSON.parse(compMatch[1]).map(c => ({ ...c, photos: [] }));
  const concessions = JSON.parse(concMatch[1]).map(c => ({ ...c, photos: [] }));

  const newFileContent = `import { Customer, DefectType, Complaint, ConcessionShipment } from '@/types';

export const DEFAULT_DEFECTS: DefectType[] = ${JSON.stringify(defects, null, 2)};

export const DEFAULT_CUSTOMERS: Customer[] = ${JSON.stringify(customers, null, 2)};

export const DEFAULT_COMPLAINTS: Complaint[] = ${JSON.stringify(complaints, null, 2)};

export const DEFAULT_CONCESSIONS: ConcessionShipment[] = ${JSON.stringify(concessions, null, 2)};
`;

  fs.writeFileSync(dataPath, newFileContent, 'utf-8');
  console.log('✅ defaultQualityData.ts limpo com sucesso! Fotos genéricas removidas.');
} else {
  console.error('Falha ao localizar seções no arquivo defaultQualityData.ts');
}
