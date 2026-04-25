import { createHash } from 'node:crypto';

/**
 * Normalizes markdown body (trim + LF unification) then returns SHA-256 hex digest.
 * Normalization prevents whitespace-only edits from triggering re-translation (RESEARCH.md Pitfall C).
 */
export function hashMarkdown(body: string): string {
  const normalized = body.trim().replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
