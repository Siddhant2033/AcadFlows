/**
 * Pure random utilities — no imports, no side effects.
 * Kept separate so models can use them without circular deps.
 */

/**
 * Generate a 10-char school code: 2 letters + 4 digits + 4 letters.
 * Example: AB12CD34EF
 */
export function generateSchoolCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  let code = '';

  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  return code;
}