import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { DevToClient } from '../devto-client.ts';

describe('DevToClient', () => {
  it('listArticles returns array of articles without body_markdown', async () => {
    const mockFetch = mock.fn(async (_url: string) =>
      ({ ok: true, json: async () => [{ id: 1, slug: 'test-post', title: 'Test', tag_list: ['cloud'], cover_image: null, canonical_url: null, published_timestamp: '2026-01-01T00:00:00Z', description: 'desc' }] } as any)
    );
    const client = new DevToClient(mockFetch as any);
    const articles = await client.listArticles('sertaoseracloud');
    assert.equal(articles.length, 1);
    assert.equal(articles[0].id, 1);
    assert.ok(!('body_markdown' in articles[0]), 'listing response must not contain body_markdown');
  });

  it('getArticle returns full article including body_markdown', async () => {
    const mockFetch = mock.fn(async (_url: string) =>
      ({ ok: true, json: async () => ({ id: 1, slug: 'test-post', title: 'Test', tag_list: [], cover_image: null, canonical_url: null, published_timestamp: '2026-01-01T00:00:00Z', description: 'desc', body_markdown: '# Hello\nWorld' }) } as any)
    );
    const client = new DevToClient(mockFetch as any);
    const article = await client.getArticle(1);
    assert.equal(article.body_markdown, '# Hello\nWorld');
  });

  it('always performs two-step fetch: list then per-article', async () => {
    let callCount = 0;
    const mockFetch = mock.fn(async (url: string) => {
      callCount++;
      if (url.includes('/articles?username')) {
        return { ok: true, json: async () => [{ id: 42, slug: 'post', title: 'T', tag_list: [], cover_image: null, canonical_url: null, published_timestamp: '2026-01-01T00:00:00Z', description: '' }] } as any;
      }
      return { ok: true, json: async () => ({ id: 42, slug: 'post', title: 'T', tag_list: [], cover_image: null, canonical_url: null, published_timestamp: '2026-01-01T00:00:00Z', description: '', body_markdown: '# T' }) } as any;
    });
    const client = new DevToClient(mockFetch as any);
    const summaries = await client.listArticles('sertaoseracloud');
    await client.getArticle(summaries[0].id);
    assert.equal(callCount, 2, 'must call fetch exactly twice: once for list, once for article');
  });
});
