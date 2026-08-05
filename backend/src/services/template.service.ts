import fs from 'fs/promises';
import { paths } from '../config/env.js';
import type { TemplateVariables } from '../types/index.js';

export class TemplateService {
  private cachedTemplate: string | null = null;
  private lastModified: number = 0;

  async loadTemplate(force = false): Promise<string> {
    const templatePath = paths.emailTemplate();

    try {
      const stat = await fs.stat(templatePath);
      if (!force && this.cachedTemplate && stat.mtimeMs === this.lastModified) {
        return this.cachedTemplate;
      }

      const content = await fs.readFile(templatePath, 'utf-8');
      this.cachedTemplate = content.trim();
      this.lastModified = stat.mtimeMs;
      return this.cachedTemplate;
    } catch {
      throw new Error(`Email template not found at ${templatePath}`);
    }
  }

  renderTemplate(template: string, variables: TemplateVariables): string {
    let rendered = template;
    const entries: [keyof TemplateVariables, string][] = [
      ['HR_NAME', variables.HR_NAME],
      ['COMPANY_NAME', variables.COMPANY_NAME],
      ['POSITION', variables.POSITION],
      ['JOB_ROLE', variables.JOB_ROLE],
      ['TODAY', variables.TODAY],
    ];

    for (const [key, value] of entries) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    }

    return rendered;
  }

  renderSubject(subjectTemplate: string, variables: TemplateVariables): string {
    return this.renderTemplate(subjectTemplate, variables);
  }

  buildVariables(
    contact: { name: string; company: string; position: string },
    jobRole: string
  ): TemplateVariables {
    return {
      HR_NAME: contact.name,
      COMPANY_NAME: contact.company,
      POSITION: contact.position,
      JOB_ROLE: jobRole,
      TODAY: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  }

  async templateExists(): Promise<boolean> {
    try {
      await fs.access(paths.emailTemplate());
      return true;
    } catch {
      return false;
    }
  }

  invalidateCache(): void {
    this.cachedTemplate = null;
    this.lastModified = 0;
  }
}

export const templateService = new TemplateService();
