const BASE_URL = 'https://dev.to/api';
const HEADERS = { Accept: 'application/vnd.forem.api-v1+json' };

export interface DevToArticleSummary {
  id: number;
  slug: string;
  title: string;
  tag_list: string[];
  cover_image: string | null;
  canonical_url: string | null;
  published_timestamp: string;
  description: string;
}

export interface DevToArticleFull extends DevToArticleSummary {
  body_markdown: string;
}

export class DevToClient {
  private fetchFn: typeof fetch;

  constructor(fetchFn: typeof fetch = globalThis.fetch) {
    this.fetchFn = fetchFn;
  }

  async listArticles(username: string): Promise<DevToArticleSummary[]> {
    const url = `${BASE_URL}/articles?username=${encodeURIComponent(username)}&per_page=30`;
    const res = await this.fetchFn(url, { headers: HEADERS });
    if (!res.ok) {
      throw new Error(`[DevToClient] listing failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<DevToArticleSummary[]>;
  }

  async getArticle(id: number): Promise<DevToArticleFull> {
    const url = `${BASE_URL}/articles/${id}`;
    const res = await this.fetchFn(url, { headers: HEADERS });
    if (!res.ok) {
      throw new Error(`[DevToClient] per-article fetch failed for id=${id}: ${res.status}`);
    }
    return res.json() as Promise<DevToArticleFull>;
  }
}
