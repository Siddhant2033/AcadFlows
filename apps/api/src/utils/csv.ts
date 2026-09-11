/**
 * Minimal, dependency-free CSV generator.
 *
 * - Escapes commas, quotes, and newlines correctly.
 * - Prefixes with UTF-8 BOM so Excel opens Indian characters correctly.
 * - Formats dates as DD/MM/YYYY.
 * - Formats numbers using en-IN locale.
 */

export type CsvValue = string | number | boolean | Date | null | undefined;

/**
 * Escape a single cell.
 */
function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  const str = String(value);
  // If the string contains comma, quote, or newline, wrap in quotes and
  // double any internal quotes.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format a date as DD/MM/YYYY (India format).
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Format a date as DD/MM/YYYY HH:MM AM/PM.
 */
export function formatDateTime(date: Date): string {
  const d = new Date(date);
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${formatDate(d)} ${time}`;
}

/**
 * Format currency as plain number (no symbol, Excel-friendly).
 * e.g., 12500.50 → "12500.50"
 */
export function formatCurrencyPlain(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Build a CSV string from an array of rows.
 *
 * @param headers - Array of header labels
 * @param rows    - Array of row arrays (must match header length)
 */
export function buildCsv(
  headers: string[],
  rows: CsvValue[][],
): string {
  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map(row =>
    row.map(escapeCell).join(','),
  );
  return [headerLine, ...bodyLines].join('\r\n');
}

/**
 * Express helper: send a CSV file response.
 *
 *   sendCsv(res, 'students.csv', headers, rows);
 */
export function sendCsv(
  res: any,
  filename: string,
  headers: string[],
  rows: CsvValue[][],
): void {
  const csv = buildCsv(headers, rows);
  const BOM = '\uFEFF';
  const body = BOM + csv;

  // Sanitize filename (no slashes)
  const safeName = filename.replace(/[\/\\]/g, '_');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeName}"`,
  );
  res.setHeader('Cache-Control', 'no-store');
  res.send(body);
}