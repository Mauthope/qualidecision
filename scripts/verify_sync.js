const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ddhqmsszumyyabkvmpqh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHFtc3N6dW15eWFia3ZtcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjg5MzMsImV4cCI6MjEwNDY0NDkzM30.aKNFJtmdjiRzeq0dJE7p0MJ7ewANr8c0vz6R_uj1rO4');

async function test() {
  const { data: custs } = await supabase.from('customers').select('name, code').in('name', [
    'UNAI NUTRICAO ANIMAL LTDA',
    'R V RACOES LTDA',
    'TROUW NUTRITION BRASIL NUTRICAO ANIMAL LTDA',
    'INDUSTRIA E COMERCIO DE FERTILIZANTES RIFERTIL LTDA - RECUPERAÇÃO JUDICIAL'
  ]);
  console.log('Clientes testados no Supabase:');
  console.log(custs);

  const { data: comp2025 } = await supabase.from('complaints').select('code, date, customer_name, customer_number, defect_type_name').like('code', 'REC-2025-%').limit(3);
  console.log('\nAmostra 2025:');
  console.log(comp2025);

  const { data: comp2026 } = await supabase.from('complaints').select('code, date, customer_name, customer_number, defect_type_name').like('code', 'REC-2026-%').limit(3);
  console.log('\nAmostra 2026:');
  console.log(comp2026);

  const { count: totalComplaints } = await supabase.from('complaints').select('*', { count: 'exact', head: true });
  console.log('\nTotal de reclamações ativas no Supabase:', totalComplaints);
}
test();
