import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import { paths } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { ExcelRow, ImportResult, ParsedContact, ValidationError } from '../types/index.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_COLUMNS = ['Name', 'Company', 'Position', 'Email'] as const;

type RawRow = Record<string, unknown>;

function normalizeRow(row: RawRow): Partial<ExcelRow> {
  const position =
    row.Position ?? row.position ?? row.Title ?? row.title ?? row['Job Title'] ?? row.Role ?? '';

  return {
    Name: String(row.Name ?? row.name ?? '').trim(),
    Company: String(row.Company ?? row.company ?? '').trim(),
    Position: String(position).trim(),
    Email: String(row.Email ?? row.email ?? row['E-mail'] ?? '').trim(),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function isRowEmpty(row: Partial<ExcelRow>): boolean {
  return !row.Name && !row.Company && !row.Position && !row.Email;
}

const SENT_COLUMN = 'Sent';
const SENT_AT_COLUMN = 'Sent At';

export class ExcelParserService {
  private writeLock: Promise<void> = Promise.resolve();

  private async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.writeLock.then(fn);
    this.writeLock = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  /** Mark matching spreadsheet row(s) after a successful send. */
  async markEmailAsSent(email: string, sentAt: Date = new Date(), filePath?: string): Promise<boolean> {
    return this.withWriteLock(async () => {
      const targetPath = filePath ?? paths.excelFile();
      const normalized = normalizeEmail(email);

      try {
        await fs.access(targetPath);
      } catch {
        logger.warn('Excel mark sent skipped — file not found', { path: targetPath, email: normalized });
        return false;
      }

      const buffer = await fs.readFile(targetPath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return false;
      }

      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
      let marked = 0;

      for (const row of rawRows) {
        const rowEmail = normalizeEmail(String(row.Email ?? row.email ?? row['E-mail'] ?? ''));
        if (rowEmail !== normalized) {
          continue;
        }
        row[SENT_COLUMN] = 'Yes';
        row[SENT_AT_COLUMN] = sentAt.toISOString();
        marked++;
      }

      if (marked === 0) {
        logger.warn('Excel mark sent — email not found in sheet', { email: normalized });
        return false;
      }

      workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(rawRows);
      const out = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      await fs.writeFile(targetPath, out);

      logger.info('Excel row marked as sent', { email: normalized, rows: marked });
      return true;
    });
  }

  async parseFile(filePath?: string): Promise<ImportResult> {
    const targetPath = filePath ?? paths.excelFile();

    try {
      await fs.access(targetPath);
    } catch {
      throw new Error(`Excel file not found at ${targetPath}`);
    }

    const buffer = await fs.readFile(targetPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error('Excel file contains no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
    const rows = rawRows.map(normalizeRow);

    const errors: ValidationError[] = [];
    const contacts: ParsedContact[] = [];
    const seenEmails = new Set<string>();
    let duplicateRows = 0;

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (isRowEmpty(row)) {
        return;
      }

      const missingFields = REQUIRED_COLUMNS.filter((col) => !String(row[col] ?? '').trim());
      if (missingFields.length > 0) {
        errors.push({
          row: rowNum,
          email: row.Email,
          reason: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      const email = normalizeEmail(String(row.Email));

      if (!isValidEmail(email)) {
        errors.push({
          row: rowNum,
          email: row.Email,
          reason: 'Invalid email address format',
        });
        return;
      }

      if (seenEmails.has(email)) {
        duplicateRows++;
        errors.push({
          row: rowNum,
          email,
          reason: 'Duplicate email address in spreadsheet',
        });
        return;
      }

      seenEmails.add(email);
      contacts.push({
        name: String(row.Name).trim(),
        company: String(row.Company).trim(),
        position: String(row.Position).trim(),
        email,
      });
    });

    const result: ImportResult = {
      totalRows: rows.filter((r) => !isRowEmpty(r)).length,
      validRows: contacts.length,
      invalidRows: errors.length,
      duplicateRows,
      contacts,
      errors,
    };

    logger.info('Excel parsed', {
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
    });

    return result;
  }

  async fileExists(): Promise<boolean> {
    try {
      await fs.access(paths.excelFile());
      return true;
    } catch {
      return false;
    }
  }
}

export const excelParserService = new ExcelParserService();
