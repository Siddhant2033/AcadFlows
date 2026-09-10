import { Tenant } from '../models/Tenant';

/**
 * Generate a unique school code (checks DB for collisions).
 * Note: this file imports Tenant. Do NOT import it from models.
 */
export async function generateUniqueSchoolCode(): Promise<string> {
  const { generateSchoolCode } = await import('./random');

  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    code = generateSchoolCode();
    const existing = await Tenant.findOne({ schoolCode: code });
    if (!existing) {
      isUnique = true;
      return code;
    }
    attempts++;
  }

  throw new Error(
    'Failed to generate unique school code after ' + maxAttempts + ' attempts',
  );
}

/** Validate format: exactly 10 chars, alphanumeric, at least 2 letters + 2 digits */
export function validateSchoolCode(code: string): boolean {
  if (!code || code.length !== 10) return false;
  if (!/^[A-Z0-9]{10}$/.test(code)) return false;

  const letterCount = (code.match(/[A-Z]/g) || []).length;
  const digitCount = (code.match(/[0-9]/g) || []).length;

  return letterCount >= 2 && digitCount >= 2;
}

/** Format as "AB12-CD34-EF" */
export function formatSchoolCode(code: string): string {
  if (!code || code.length !== 10) return code || '';
  return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
}

/** Remove hyphens/spaces, uppercase */
export function normalizeSchoolCode(code: string): string {
  if (!code) return '';
  return code.replace(/[-\s]/g, '').toUpperCase();
}