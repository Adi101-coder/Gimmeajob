import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { AppConfig } from '../types/index.js';

export interface PersonalizationInput {
  recruiterName: string;
  company: string;
  recruiterPosition: string;
  targetRole: string;
  template: string;
}

export interface PersonalizationResult {
  body: string;
  status: 'success' | 'fallback';
  error?: string;
}

export class LLMService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      if (!env.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      this.client = new OpenAI({ apiKey: env.openaiApiKey });
    }
    return this.client;
  }

  async personalizeEmail(
    input: PersonalizationInput,
    config: AppConfig
  ): Promise<PersonalizationResult> {
    const systemPrompt = `You are a professional email writer helping a job applicant send personalized outreach emails to recruiters.

Rules:
- Generate a concise, professional application email
- Stay faithful to the structure and intent of the provided template
- Vary wording naturally while preserving the core message
- Use ONLY the information provided — do NOT invent facts about the recruiter, company, or applicant
- Do NOT add fictional achievements, connections, or company details
- Keep the email between 100-200 words
- Do NOT include a subject line — body only
- Do NOT include placeholder brackets or template variables
- Sign off professionally without inventing a name`;

    const userPrompt = `Recruiter Name: ${input.recruiterName}
Company: ${input.company}
Recruiter Position: ${input.recruiterPosition}
Target Role (applying for): ${input.targetRole}

Email Template to personalize:
---
${input.template}
---

Write the personalized email body:`;

    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: config.llm.model,
        temperature: config.llm.temperature,
        max_tokens: config.llm.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const body = response.choices[0]?.message?.content?.trim();

      if (!body) {
        throw new Error('LLM returned empty response');
      }

      logger.debug('Email personalized via LLM', { company: input.company });
      return { body, status: 'success' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown LLM error';
      logger.warn('LLM personalization failed, using template fallback', {
        company: input.company,
        error: message,
      });
      return {
        body: input.template,
        status: 'fallback',
        error: message,
      };
    }
  }

  isConfigured(): boolean {
    return Boolean(env.openaiApiKey);
  }
}

export const llmService = new LLMService();
