import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// Import the internal pipeline runner (not the top-level main function)
import { processArticles } from '../sync-devto.ts';

interface MockArticle {
  id: number;
  slug: string;
  hasChanged: boolean;
  manualOverride: boolean;
}

describe('Sync Pipeline', () => {
  it('circuit breaker: stops after maxTranslations articles', async () => {
    const translated: number[] = [];
    // Create 10 articles that all appear "changed"
    const articles: MockArticle[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      slug: `post-${i + 1}`,
      hasChanged: true,
      manualOverride: false,
    }));

    await processArticles(articles as any, {
      maxTranslations: 5,
      onTranslate: (id: number) => translated.push(id),
      translate: async () => ({ translated: '', sectionsCount: 0, inputTokens: 0, outputTokens: 0 }),
      enforce: () => ({ passed: true, driftedTerms: [] }),
      writePost: async () => {},
      openPr: async () => 'https://github.com/pr/1',
      openIssue: async () => {},
    });

    assert.equal(translated.length, 5, `expected 5 translations, got ${translated.length}`);
  });

  it('skips article with manualOverride:true and logs skip (D-03)', async () => {
    const translated: number[] = [];
    const skipped: number[] = [];
    const articles: MockArticle[] = [
      { id: 1, slug: 'normal-post', hasChanged: true, manualOverride: false },
      { id: 2, slug: 'protected-post', hasChanged: true, manualOverride: true },
      { id: 3, slug: 'another-post', hasChanged: true, manualOverride: false },
    ];

    await processArticles(articles as any, {
      maxTranslations: 5,
      onTranslate: (id: number) => translated.push(id),
      onSkip: (id: number) => skipped.push(id),
      translate: async () => ({ translated: '', sectionsCount: 0, inputTokens: 0, outputTokens: 0 }),
      enforce: () => ({ passed: true, driftedTerms: [] }),
      writePost: async () => {},
      openPr: async () => 'https://github.com/pr/1',
      openIssue: async () => {},
    });

    assert.ok(skipped.includes(2), 'article 2 (manualOverride) must be skipped');
    assert.ok(!translated.includes(2), 'article 2 must not be translated');
    assert.ok(translated.includes(1) && translated.includes(3), 'other articles must be processed');
  });

  it('skips article when hasChanged is false (no drift in hash)', async () => {
    const translated: number[] = [];
    const articles: MockArticle[] = [
      { id: 1, slug: 'unchanged', hasChanged: false, manualOverride: false },
      { id: 2, slug: 'changed', hasChanged: true, manualOverride: false },
    ];

    await processArticles(articles as any, {
      maxTranslations: 5,
      onTranslate: (id: number) => translated.push(id),
      translate: async () => ({ translated: '', sectionsCount: 0, inputTokens: 0, outputTokens: 0 }),
      enforce: () => ({ passed: true, driftedTerms: [] }),
      writePost: async () => {},
      openPr: async () => 'https://github.com/pr/1',
      openIssue: async () => {},
    });

    assert.ok(!translated.includes(1), 'unchanged article must not be translated');
    assert.ok(translated.includes(2), 'changed article must be translated');
  });
});
