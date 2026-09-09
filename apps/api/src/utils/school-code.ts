import { Tenant } from '../models/Tenant';

/**
 * Generate a unique 10-digit alphanumeric school code
 * Format: 2 letters + 4 digits + 4 letters
 * Example: AB12CD34EF
 */
export function generateSchoolCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let code = '';
  
  // 2 letters
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 4 digits
  for (let i = 0; i < 4; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  // 4 letters
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  return code;
}

/**
 * Generate a unique school code (ensures no duplicates)
 */
export async function generateUniqueSchoolCode(): Promise<string> {
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
  
  throw new Error('Failed to generate unique school code after ' + maxAttempts + ' attempts');
}

/**
 * Validate school code format
 * Must be exactly 10 characters, alphanumeric
 */
export function validateSchoolCode(code: string): boolean {
  // Must be exactly 10 characters
  if (!code || code.length !== 10) {
    return false;
  }
  
  // Must be alphanumeric
  if (!/^[A-Z0-9]{10}$/.test(code)) {
    return false;
  }
  
  // Must have at least 2 letters and 2 digits
  const letterCount = (code.match(/[A-Z]/g) || []).length;
  const digitCount = (code.match(/[0-9]/g) || []).length;
  
  if (letterCount < 2 || digitCount < 2) {
    return false;
  }
  
  return true;
}

/**
 * Format school code for display (adds hyphens for readability)
 * Example: AB12CD34EF → AB12-CD34-EF
 */
export function formatSchoolCode(code: string): string {
  if (!code || code.length !== 10) return code || '';
  return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
}

/**
 * Normalize school code (remove hyphens, spaces, uppercase)
 */
export function normalizeSchoolCode(code: string): string {
  if (!code) return '';
  return code.replace(/[-\s]/g, '').toUpperCase();
}