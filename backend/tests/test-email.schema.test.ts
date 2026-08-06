import { describe, it, expect } from 'vitest';
import { TestEmailSchema } from '../src/types/index.js';

describe('TestEmailSchema', () => {
  it('should accept valid email', () => {
    const result = TestEmailSchema.parse({ to: 'test@example.com' });
    expect(result.to).toBe('test@example.com');
    expect(result.attachResume).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(() => TestEmailSchema.parse({ to: 'not-an-email' })).toThrow();
  });

  it('should allow disabling resume attachment', () => {
    const result = TestEmailSchema.parse({ to: 'test@example.com', attachResume: false });
    expect(result.attachResume).toBe(false);
  });
});
