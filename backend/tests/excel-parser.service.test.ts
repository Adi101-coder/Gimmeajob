import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { ExcelParserService } from '../src/services/excel-parser.service.js';

const TEST_DIR = path.join(process.cwd(), 'tests', 'fixtures');
const TEST_FILE = path.join(TEST_DIR, 'test_contacts.xlsx');

describe('ExcelParserService', () => {
  const service = new ExcelParserService();

  beforeAll(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });

    const data = [
      { Name: 'Alice Johnson', Company: 'TechCorp', Position: 'Recruiter', Email: 'alice@techcorp.com' },
      { Name: 'Bob Smith', Company: 'DataInc', Position: 'HR Manager', Email: 'bob@datainc.com' },
      { Name: '', Company: 'Missing', Position: 'Recruiter', Email: 'incomplete@test.com' },
      { Name: 'Charlie', Company: 'BadEmail', Position: 'Recruiter', Email: 'not-an-email' },
      { Name: 'Duplicate', Company: 'DupCo', Position: 'Recruiter', Email: 'alice@techcorp.com' },
      { Name: '', Company: '', Position: '', Email: '' },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, TEST_FILE);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  it('should parse valid contacts and skip invalid rows', async () => {
    const result = await service.parseFile(TEST_FILE);

    expect(result.validRows).toBe(2);
    expect(result.contacts).toHaveLength(2);
    expect(result.contacts[0].email).toBe('alice@techcorp.com');
    expect(result.contacts[1].email).toBe('bob@datainc.com');
  });

  it('should detect duplicate emails', async () => {
    const result = await service.parseFile(TEST_FILE);
    expect(result.duplicateRows).toBe(1);
    expect(result.errors.some((e) => e.reason.includes('Duplicate'))).toBe(true);
  });

  it('should detect invalid email addresses', async () => {
    const result = await service.parseFile(TEST_FILE);
    expect(result.errors.some((e) => e.reason.includes('Invalid email'))).toBe(true);
  });

  it('should detect missing required fields', async () => {
    const result = await service.parseFile(TEST_FILE);
    expect(result.errors.some((e) => e.reason.includes('Missing required fields'))).toBe(true);
  });

  it('should throw when file not found', async () => {
    await expect(service.parseFile('/nonexistent/file.xlsx')).rejects.toThrow('not found');
  });
});
