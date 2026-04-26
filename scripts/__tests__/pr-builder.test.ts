import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { PRBuilder } from '../pr-builder.ts';
import { collections } from '../../src/content.config.js';

// TypeScript resolves content.config.js to the .ts type via moduleResolution:Bundler,
// making `schema` appear as Astro's CollectionConfig.schema union. Cast to ZodTypeAny
// so tests can call .safeParse() — the runtime value is always a plain ZodObject.
const postsSchema = collections.posts.schema as z.ZodTypeAny;

const mockArticle = {
  id: 12345,
  slug: 'test-article',
  title: 'Test Article PT-BR',
  description: 'Descrição do artigo de teste',
  pubDate: '2026-04-24',
  tags: ['cloud', 'aws'],
  coverImageUrl: null,
  coverAlt: null,
  canonicalUrl: 'https://sertaoseracloud.com/posts/test-article',
  bodyMarkdownHash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
  translatedBody: '## Seção\n\nConteúdo traduzido.',
  sectionsCount: 1,
  inputTokens: 100,
  outputTokens: 50,
  enforcerResult: { passed: true, driftedTerms: [] },
};

describe('PRBuilder', () => {
  it('buildFrontmatter produces output that satisfies the Zod schema', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const frontmatter = builder.buildFrontmatter(mockArticle);
    const result = postsSchema.safeParse(frontmatter);
    assert.ok(result.success, `Zod validation failed: ${JSON.stringify(result.error?.issues)}`);
  });

  it('buildFrontmatter sets source.platform to "dev.to"', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const frontmatter = builder.buildFrontmatter(mockArticle);
    assert.equal(frontmatter.source?.platform, 'dev.to');
  });

  it('buildFrontmatter sets source.translated_by to "claude-haiku-4-5"', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const frontmatter = builder.buildFrontmatter(mockArticle);
    assert.equal(frontmatter.source?.translated_by, 'claude-haiku-4-5');
  });

  it('buildFrontmatter sets manual_override to false', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const frontmatter = builder.buildFrontmatter(mockArticle);
    assert.equal(frontmatter.manual_override, false);
  });

  it('buildPrBody includes all four D-04 sections', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const body = builder.buildPrBody(mockArticle);
    assert.ok(body.includes('## Source'), 'missing ## Source section');
    assert.ok(body.includes('## Translation Stats'), 'missing ## Translation Stats section');
    assert.ok(body.includes('## Glossary Enforcement'), 'missing ## Glossary Enforcement section');
    assert.ok(body.includes('## Canonical URL Lint'), 'missing ## Canonical URL Lint section');
  });

  it('buildPrBody includes PASS badge when enforcer passed', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const body = builder.buildPrBody(mockArticle);
    assert.ok(body.includes('PASS') || body.includes('✓'), 'missing PASS/✓ badge in glossary section');
  });

  it('canonical URL lint shows ✓ when canonicalUrl starts with https://sertaoseracloud.com/posts/', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const body = builder.buildPrBody(mockArticle);
    assert.ok(body.includes('✓'), 'missing ✓ in canonical lint section');
  });

  // D-17: coverAlt fallback — article has coverImageUrl but no explicit coverAlt
  it('D-17: buildFrontmatter sets coverAlt to article.title when coverImageUrl present and coverAlt null', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const articleWithCover = {
      ...mockArticle,
      coverImageUrl: 'https://dev.to/image.jpg',
      coverAlt: null,
    };
    const frontmatter = builder.buildFrontmatter(articleWithCover);
    assert.equal(frontmatter.coverAlt, articleWithCover.title);
  });

  // D-17: explicit coverAlt is preserved when provided
  it('D-17: buildFrontmatter preserves explicit coverAlt when provided', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const articleWithAlt = {
      ...mockArticle,
      coverImageUrl: 'https://dev.to/image.jpg',
      coverAlt: 'Screenshot of AWS console',
    };
    const frontmatter = builder.buildFrontmatter(articleWithAlt);
    assert.equal(frontmatter.coverAlt, 'Screenshot of AWS console');
  });

  // D-16: schema rejects coverImageUrl present with coverAlt absent
  it('D-16: schema rejects post with coverImageUrl present but coverAlt absent', () => {
    const result = postsSchema.safeParse({
      title: 'Test',
      description: 'Test description',
      pubDate: new Date(),
      draft: false,
      tags: [],
      coverImageUrl: 'https://example.com/image.jpg',
      // coverAlt intentionally absent
      manual_override: false,
    });
    assert.equal(result.success, false);
    const hasAltIssue = result.error?.issues.some((i: { path: unknown[] }) => i.path.includes('coverAlt'));
    assert.ok(hasAltIssue, 'expected Zod issue on coverAlt path');
  });

  // D-16: schema accepts post with coverImageUrl and coverAlt both present
  it('D-16: schema accepts post with coverImageUrl and coverAlt both present', () => {
    const result = postsSchema.safeParse({
      title: 'Test',
      description: 'Test description',
      pubDate: new Date(),
      draft: false,
      tags: [],
      coverImageUrl: 'https://example.com/image.jpg',
      coverAlt: 'A descriptive alt text',
      manual_override: false,
    });
    assert.ok(result.success, `unexpected Zod failure: ${JSON.stringify(result.error?.issues)}`);
  });
});
