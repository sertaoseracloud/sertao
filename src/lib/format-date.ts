/**
 * Formats a Date as PT-BR long date string.
 * Example: new Date('2026-04-25T12:00:00') → "25 de abril de 2026"
 *
 * TIMEZONE NOTE: new Date('2026-04-25') (ISO date string without time) creates
 * UTC midnight. America/Sao_Paulo (UTC-3) shifts it to Apr 24. To stay on the
 * correct calendar day, pass dates with noon time: new Date('2026-04-25T12:00:00').
 * For frontmatter dates (from Zod coerce.date on YYYY-MM-DD), the off-by-one is
 * expected behavior and acceptable for display purposes.
 */
export function formatDatePtBr(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}
