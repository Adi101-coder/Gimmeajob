import fs from 'fs/promises';
import crypto from 'crypto';
import { paths } from '../config/env.js';

export interface ResumeInfo {
  path: string;
  filename: string;
  size: number;
  hash: string;
  lastModified: Date;
}

export class ResumeService {
  private cachedInfo: ResumeInfo | null = null;

  async getResumeInfo(force = false): Promise<ResumeInfo> {
    const resumePath = paths.resume();

    try {
      const stat = await fs.stat(resumePath);
      if (!force && this.cachedInfo && this.cachedInfo.lastModified.getTime() === stat.mtimeMs) {
        return this.cachedInfo;
      }

      const buffer = await fs.readFile(resumePath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      this.cachedInfo = {
        path: resumePath,
        filename: 'Resume.pdf',
        size: stat.size,
        hash,
        lastModified: stat.mtime,
      };

      return this.cachedInfo;
    } catch {
      throw new Error(`Resume not found at ${resumePath}. Please place Resume.pdf in the resumes folder.`);
    }
  }

  async getResumeBuffer(): Promise<{ buffer: Buffer; filename: string }> {
    const info = await this.getResumeInfo(true);
    const buffer = await fs.readFile(info.path);
    return { buffer, filename: info.filename };
  }

  async resumeExists(): Promise<boolean> {
    try {
      await fs.access(paths.resume());
      return true;
    } catch {
      return false;
    }
  }

  invalidateCache(): void {
    this.cachedInfo = null;
  }
}

export const resumeService = new ResumeService();
