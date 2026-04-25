export interface EnforcerResult {
  passed: boolean;
  driftedTerms: string[];
}

/**
 * Counts occurrences of each preserve_as_is term in EN source and PT output.
 * Fails if PT count < EN count for any term that appears in EN (D-09: hard fail on drift).
 * Uses exact case-sensitive string matching — pluralization intentionally causes drift
 * (documented trade-off per RESEARCH.md Pitfall D; fix by adding plural form to glossary).
 */
export function enforceGlossary(
  enSource: string,
  ptOutput: string,
  preserveList: string[],
): EnforcerResult {
  const driftedTerms: string[] = [];

  for (const term of preserveList) {
    const enCount = countOccurrences(enSource, term);
    if (enCount === 0) continue; // Term not in EN — not a drift

    const ptCount = countOccurrences(ptOutput, term);
    if (ptCount < enCount) {
      driftedTerms.push(`${term} (EN: ${enCount}, PT: ${ptCount})`);
    }
  }

  return { passed: driftedTerms.length === 0, driftedTerms };
}

function countOccurrences(text: string, term: string): number {
  // Escape regex special chars in term for safe exact-string matching
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (text.match(new RegExp(escaped, 'g')) ?? []).length;
}
