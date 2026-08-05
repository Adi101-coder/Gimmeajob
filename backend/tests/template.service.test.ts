import { describe, it, expect, beforeAll } from 'vitest';
import { TemplateService } from '../src/services/template.service.js';
import type { TemplateVariables } from '../src/types/index.js';

describe('TemplateService', () => {
  const service = new TemplateService();

  const variables: TemplateVariables = {
    HR_NAME: 'Jane Smith',
    COMPANY_NAME: 'Acme Corp',
    POSITION: 'Senior Recruiter',
    JOB_ROLE: 'Software Engineer',
    TODAY: 'August 6, 2026',
  };

  it('should replace all template variables', () => {
    const template = 'Dear {{HR_NAME}}, applying for {{JOB_ROLE}} at {{COMPANY_NAME}} ({{POSITION}}) on {{TODAY}}.';
    const result = service.renderTemplate(template, variables);

    expect(result).toBe('Dear Jane Smith, applying for Software Engineer at Acme Corp (Senior Recruiter) on August 6, 2026.');
  });

  it('should replace multiple occurrences of same variable', () => {
    const template = '{{COMPANY_NAME}} is great. I love {{COMPANY_NAME}}.';
    const result = service.renderTemplate(template, variables);
    expect(result).toBe('Acme Corp is great. I love Acme Corp.');
  });

  it('should render subject template', () => {
    const subject = 'Application for {{JOB_ROLE}} at {{COMPANY_NAME}}';
    const result = service.renderSubject(subject, variables);
    expect(result).toBe('Application for Software Engineer at Acme Corp');
  });

  it('should build variables from contact data', () => {
    const vars = service.buildVariables(
      { name: 'John', company: 'TechCo', position: 'HR Manager' },
      'Data Analyst'
    );
    expect(vars.HR_NAME).toBe('John');
    expect(vars.COMPANY_NAME).toBe('TechCo');
    expect(vars.POSITION).toBe('HR Manager');
    expect(vars.JOB_ROLE).toBe('Data Analyst');
    expect(vars.TODAY).toBeTruthy();
  });
});
