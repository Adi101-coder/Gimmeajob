import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(path.join(projectRoot, 'backend', 'package.json'));
const XLSX = require('xlsx');

const data = [
  { Name: 'Sarah Mitchell', Company: 'Google', Position: 'Technical Recruiter', Email: 'sarah.mitchell@google.com' },
  { Name: 'James Wilson', Company: 'Microsoft', Position: 'Senior Recruiter', Email: 'james.wilson@microsoft.com' },
  { Name: 'Emily Chen', Company: 'Amazon', Position: 'HR Business Partner', Email: 'emily.chen@amazon.com' },
  { Name: 'Michael Brown', Company: 'Meta', Position: 'Talent Acquisition', Email: 'michael.brown@meta.com' },
  { Name: 'Lisa Anderson', Company: 'Apple', Position: 'Recruiting Manager', Email: 'lisa.anderson@apple.com' },
  { Name: 'David Lee', Company: 'Netflix', Position: 'Technical Recruiter', Email: 'david.lee@netflix.com' },
  { Name: 'Jennifer Taylor', Company: 'Stripe', Position: 'People Operations', Email: 'jennifer.taylor@stripe.com' },
  { Name: 'Robert Garcia', Company: 'Airbnb', Position: 'Senior Recruiter', Email: 'robert.garcia@airbnb.com' },
];

const dataDir = path.join(projectRoot, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'HR Contacts');
XLSX.writeFile(wb, path.join(dataDir, 'hr_database.xlsx'));

// Minimal valid PDF
const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 44>>stream
BT /F1 24 Tf 100 700 Td (Sample Resume) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000343 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
436
%%EOF`;

const resumesDir = path.join(projectRoot, 'resumes');
fs.mkdirSync(resumesDir, { recursive: true });
fs.writeFileSync(path.join(resumesDir, 'Resume.pdf'), pdfContent);

console.log('Sample data generated successfully');
