// packages/shared/src/constants/india.ts
export const INDIA = {
  country: 'IN',
  currency: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
  },
  timezone: 'Asia/Kolkata',
  phone: {
    code: '+91',
    /** Indian mobile numbers: 10 digits, first digit 6-9 */
    pattern: /^[6-9]\d{9}$/,
    maxLength: 10,
  },
  dateFormat: 'DD/MM/YYYY',
  academic: {
    board: 'CBSE',
    /** Indian academic year runs April → March */
    startMonth: 4,
    endMonth: 3,
  },
} as const;

export type IndiaConfig = typeof INDIA;