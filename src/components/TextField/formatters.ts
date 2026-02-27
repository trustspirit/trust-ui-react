/**
 * Strip all non-digit characters from a string.
 */
export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Format a phone number string as Korean mobile format: 010-1234-5678.
 * Accepts raw digits and progressively formats them (3-4-4 pattern).
 */
export function formatTel(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * Extract raw digits from a formatted telephone string.
 */
export function unformatTel(value: string): string {
  return stripNonDigits(value);
}

/**
 * Format integer digits with comma separators: 1234567 -> 1,234,567.
 * Strips non-digit characters.
 */
export function formatCurrency(value: string): string {
  const digits = stripNonDigits(value);
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

/**
 * Extract raw numeric string from a currency-formatted value.
 */
export function unformatCurrency(value: string): string {
  return stripNonDigits(value);
}

/**
 * Format a decimal number string with commas on the integer part.
 * Allows a single decimal point and preserves the decimal portion.
 */
export function formatDecimal(value: string): string {
  // Allow only digits and a single decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] ?? '';
  const decimalPart = parts.length > 1 ? parts[1] : undefined;

  const formattedInteger = integerPart
    ? Number(integerPart).toLocaleString('en-US')
    : '';

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  // Preserve trailing dot if user just typed it
  if (cleaned.endsWith('.')) {
    return `${formattedInteger}.`;
  }

  return formattedInteger;
}

/**
 * Extract raw numeric string from a decimal-formatted value.
 */
export function unformatDecimal(value: string): string {
  return value.replace(/,/g, '');
}
