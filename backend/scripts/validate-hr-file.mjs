import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const wb = XLSX.readFile('../data/hr_database.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const seen = new Set();
let valid = 0;
let invalid = 0;
let dupes = 0;

for (const row of rows) {
  const name = String(row.Name ?? '').trim();
  const company = String(row.Company ?? '').trim();
  const position = String(row.Title ?? row.Position ?? '').trim();
  const email = String(row.Email ?? '').trim().toLowerCase();

  if (!name && !company && !position && !email) continue;

  if (!name || !company || !position || !email || !emailRe.test(email)) {
    invalid++;
    continue;
  }
  if (seen.has(email)) {
    dupes++;
    continue;
  }
  seen.add(email);
  valid++;
}

console.log(JSON.stringify({ totalRows: rows.length, valid, invalid, dupes }, null, 2));
