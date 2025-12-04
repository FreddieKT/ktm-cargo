import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
      });
    }
  } catch (e) {
    console.error(e);
  }
}
loadEnv();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  console.log('Probing Invoices...');
  // Try inserting with standard fields
  const { data: inv1, error: err1 } = await supabase
    .from('invoices')
    .insert({
      invoice_number: 'TEST-INV-001',
      total_amount: 100,
    })
    .select();

  if (!err1) {
    console.log('Invoices insert success with basic fields.');
    if (inv1.length > 0) console.log('Invoice Columns:', Object.keys(inv1[0]));
    await supabase.from('invoices').delete().eq('invoice_number', 'TEST-INV-001');
  } else {
    console.log('Invoices insert failed:', err1.message);
  }
}

checkColumns();
