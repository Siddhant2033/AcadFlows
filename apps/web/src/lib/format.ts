// apps/web/src/lib/format.ts
import { INDIA } from '@school-platform/shared';

/* ─────────────────────────── Currency ─────────────────────────── */

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat(INDIA.currency.locale, {
    style: 'currency',
    currency: INDIA.currency.code,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatCurrencyDetailed = (amount: number): string =>
  new Intl.NumberFormat(INDIA.currency.locale, {
    style: 'currency',
    currency: INDIA.currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/* ─────────────────────────── Dates ─────────────────────────── */

/** Format as DD/MM/YYYY */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

/** Format as DD/MM/YYYY, HH:MM AM/PM in IST */
export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const time = d.toLocaleTimeString('en-IN', {
    timeZone: INDIA.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${formatDate(d)}, ${time}`;
};

/** Format as "5 minutes ago", "2 hours ago", "3 days ago", or fall back to date */
export const formatTimeAgo = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return formatDate(d);
};

/* ─────────────────────────── Phone ─────────────────────────── */

/** Format 9876543210 → "+91 98765 43210" */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (clean.length !== 10) return phone;
  return `${INDIA.phone.code} ${clean.slice(0, 5)} ${clean.slice(5)}`;
};

/** Strip everything except digits, return last 10 (for storage) */
export const normalizePhone = (phone: string): string =>
  phone.replace(/\D/g, '').slice(-10);

/** True if the input is a valid Indian mobile number */
export const isValidIndianPhone = (phone: string): boolean =>
  INDIA.phone.pattern.test(normalizePhone(phone));

/* ─────────────────────────── Other ─────────────────────────── */

/** Format a number as an Indian-style percent: "94%" */
export const formatPercent = (value: number): string =>
  `${Math.round(value)}%`;

/** Format a school code as "AB12-CD34-EF" */
export const formatSchoolCode = (code: string | undefined | null): string => {
  if (!code) return '';
  const clean = code.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length !== 10) return code;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
};

/** Initials from a name: "Priya Sharma" → "PS" */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase() || '?';
};