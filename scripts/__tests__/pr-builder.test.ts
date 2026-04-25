import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRBuilder } from '../pr-builder.ts';
import { collections } from '../../src/content.config.js';

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
    const result = collections.posts.schema.safeParse(frontmatter);
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
});
