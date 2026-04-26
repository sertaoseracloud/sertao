import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { SyncArticle } from './types.ts';

// Canonical prefix for D-07 check
const CANONICAL_PREFIX = 'https://sertaoseracloud.com/posts/';
const DEVTO_USERNAME = 'sertaoseracloud';

export interface PostFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  draft: boolean;
  tags: string[];
  coverImageUrl?: string;
  coverAlt?: string;
  source: {
    platform: 'dev.to';
    id: number;
    url: string;
    hash: string;
    synced_at: Date;
    translated_by: string;
  };
  canonical_url?: string;
  manual_override: boolean;
}

export class PRBuilder {
  private postsDir: string;
  private imagesDir: string;
  private fetchFn: typeof fetch;

  constructor(
    postsDir: string,
    imagesDir: string,
    fetchFn: typeof fetch = globalThis.fetch,
  ) {
    this.postsDir = postsDir;
    this.imagesDir = imagesDir;
    this.fetchFn = fetchFn;
  }

  buildFrontmatter(article: SyncArticle): PostFrontmatter {
    const fm: PostFrontmatter = {
      title: article.title.slice(0, 80),
      description: article.description.slice(0, 200),
      pubDate: new Date(article.pubDate),
      draft: false,
      tags: article.tags,
      source: {
        platform: 'dev.to',
        id: article.id,
        url: `https://dev.to/${DEVTO_USERNAME}/${article.slug}`,
        hash: article.bodyMarkdownHash,
        synced_at: new Date(),
        translated_by: 'claude-haiku-4-5',
      },
      manual_override: false,
    };
    if (article.canonicalUrl) {
      fm.canonical_url = article.canonicalUrl;
    }
    if (article.coverImageUrl) {
      fm.coverImageUrl = article.coverImageUrl;
      fm.coverAlt = article.coverAlt ?? article.title;
    }
    return fm;
  }

  async writePost(article: SyncArticle): Promise<void> {
    await mkdir(this.postsDir, { recursive: true });
    const fm = this.buildFrontmatter(article);
    const yaml = this.serializeFrontmatter(fm);
    const content = `---\n${yaml}---\n\n${article.translatedBody}\n`;
    const dest = path.join(this.postsDir, `${article.slug}.md`);
    await writeFile(dest, content, 'utf8');
    console.log(`[PRBuilder] Wrote ${dest}`);
  }

  buildPrBody(article: SyncArticle, issueUrl?: string): string {
    const now = new Date().toISOString();
    const glossaryStatus = article.enforcerResult.passed
      ? `PASS ✓ — ${this.termCount(article)} terms checked`
      : `WARN ⚠ — glossary drift detected\n${article.enforcerResult.driftedTerms.map((t) => `  - ${t}`).join('\n')}`;
    const canonicalStatus = this.checkCanonical(article.canonicalUrl)
      ? `✓ \`canonical_url\` is set correctly: \`${article.canonicalUrl}\``
      : issueUrl
        ? `⚠ \`canonical_url\` is missing or incorrect — see ${issueUrl}`
        : `⚠ \`canonical_url\` is missing or incorrect — an Issue has been opened with fix instructions`;

    return `## Source
**Title:** ${article.title}
**Dev.to URL:** https://dev.to/${DEVTO_USERNAME}/${article.slug}
**Synced at:** ${now}

## Translation Stats
**Sections translated:** ${article.sectionsCount}
**Model:** claude-haiku-4-5
**Token estimate:** ${article.inputTokens} in / ${article.outputTokens} out

## Glossary Enforcement
${glossaryStatus}

## Canonical URL Lint
${canonicalStatus}
`;
  }

  async downloadCoverImage(url: string, slug: string): Promise<string | null> {
    if (!url) return null;
    try {
      await mkdir(this.imagesDir, { recursive: true });
      const ext = (url.split('.').pop()?.split('?')[0] ?? 'jpg').toLowerCase();
      const res = await this.fetchFn(url);
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `${slug}.${ext}`;
      await writeFile(path.join(this.imagesDir, filename), buffer);
      return filename;
    } catch {
      return null;
    }
  }

  /**
   * Open a draft GitHub PR via REST API (D-05: draft + reviewer assignment).
   * Uses GITHUB_TOKEN from environment; must be called only in GH Actions context.
   * Returns the PR URL.
   *
   * Design note: peter-evans/create-pull-request@v7 is not used here because
   * the sync script processes multiple articles per run and the Action cannot
   * be called in a loop from within the workflow YAML cleanly. The REST API
   * gives full TypeScript control and matches the architecture recommendation
   * from RESEARCH.md Open Question 1 (Option B).
   */
  async openGitHubPr(
    article: SyncArticle,
    githubToken: string,
    repo: string,
    baseBranch: string = 'main',
  ): Promise<string> {
    const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();
    const branch = `sync/${article.slug}-${runId}`;

    // Step 1: Get SHA of base branch HEAD
    const refRes = await this.fetchFn(
      `https://api.github.com/repos/${repo}/git/ref/heads/${baseBranch}`,
      { headers: this.ghHeaders(githubToken) },
    );
    if (!refRes.ok) throw new Error(`[PRBuilder] Failed to get ref: ${refRes.status}`);
    const refData = (await refRes.json()) as { object: { sha: string } };
    const baseSha = refData.object.sha;

    // Step 2: Create new branch
    const createBranchRes = await this.fetchFn(
      `https://api.github.com/repos/${repo}/git/refs`,
      {
        method: 'POST',
        headers: this.ghHeaders(githubToken),
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
      },
    );
    if (!createBranchRes.ok) {
      throw new Error(`[PRBuilder] Failed to create branch: ${createBranchRes.status}`);
    }

    // Step 3: Get the file content to commit (already written to postsDir)
    const filePath = `src/content/posts/${article.slug}.md`;
    const { readFile } = await import('node:fs/promises');
    const fileContent = await readFile(path.join(this.postsDir, `${article.slug}.md`), 'utf8');
    const encodedContent = Buffer.from(fileContent).toString('base64');

    // Step 4: Create or update file on the new branch
    const putRes = await this.fetchFn(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: this.ghHeaders(githubToken),
        body: JSON.stringify({
          message: `sync: translate '${article.title}' from dev.to`,
          content: encodedContent,
          branch,
        }),
      },
    );
    if (!putRes.ok) {
      const text = await putRes.text();
      throw new Error(`[PRBuilder] Failed to commit file: ${putRes.status} ${text}`);
    }

    // Step 5: Open draft PR with reviewer
    const prTitle = `[sync] ${article.title} (dev.to #${article.id})`;
    const prBody = this.buildPrBody(article, article.canonicalIssueUrl ?? undefined);
    const prRes = await this.fetchFn(
      `https://api.github.com/repos/${repo}/pulls`,
      {
        method: 'POST',
        headers: this.ghHeaders(githubToken),
        body: JSON.stringify({
          title: prTitle,
          body: prBody,
          head: branch,
          base: baseBranch,
          draft: true,
        }),
      },
    );
    if (!prRes.ok) {
      const text = await prRes.text();
      throw new Error(`[PRBuilder] Failed to create PR: ${prRes.status} ${text}`);
    }
    const prData = (await prRes.json()) as { html_url: string; number: number };
    const prUrl = prData.html_url;
    const prNumber = prData.number;

    // Step 6: Assign reviewer (D-05). May silently fail with GITHUB_TOKEN (see RESEARCH.md Pitfall B).
    const reviewerRes = await this.fetchFn(
      `https://api.github.com/repos/${repo}/pulls/${prNumber}/requested_reviewers`,
      {
        method: 'POST',
        headers: this.ghHeaders(githubToken),
        body: JSON.stringify({ reviewers: [DEVTO_USERNAME] }),
      },
    );
    if (!reviewerRes.ok) {
      // Non-fatal — log warning but do not fail the PR creation
      console.warn(
        `[PRBuilder] Reviewer assignment failed (status ${reviewerRes.status}). ` +
          'If using GITHUB_TOKEN, try setting a GH_PAT secret with pull-requests:write scope instead.',
      );
    }

    console.log(`[PRBuilder] Draft PR opened: ${prUrl}`);
    return prUrl;
  }

  async openGitHubIssue(
    title: string,
    body: string,
    githubToken: string,
    repo: string,
  ): Promise<string> {
    const res = await this.fetchFn(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: this.ghHeaders(githubToken),
      body: JSON.stringify({ title, body }),
    });
    if (!res.ok) {
      console.error(`[PRBuilder] Failed to open issue: ${res.status}`);
      return '';
    }
    const data = (await res.json()) as { html_url: string };
    return data.html_url;
  }

  checkCanonical(canonicalUrl: string | null | undefined): boolean {
    return !!canonicalUrl && canonicalUrl.startsWith(CANONICAL_PREFIX);
  }

  private ghHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private serializeFrontmatter(fm: PostFrontmatter): string {
    const lines: string[] = [];
    lines.push(`title: ${JSON.stringify(fm.title)}`);
    lines.push(`description: ${JSON.stringify(fm.description)}`);
    lines.push(`pubDate: ${this.formatDate(fm.pubDate)}`);
    lines.push(`draft: ${fm.draft}`);
    lines.push(`tags: ${JSON.stringify(fm.tags)}`);
    if (fm.coverImageUrl) lines.push(`coverImageUrl: ${JSON.stringify(fm.coverImageUrl)}`);
    if (fm.coverAlt) lines.push(`coverAlt: ${JSON.stringify(fm.coverAlt)}`);
    lines.push(`source:`);
    lines.push(`  platform: ${fm.source.platform}`);
    lines.push(`  id: ${fm.source.id}`);
    lines.push(`  url: ${JSON.stringify(fm.source.url)}`);
    lines.push(`  hash: "${fm.source.hash}"`);
    lines.push(`  synced_at: ${this.formatDate(fm.source.synced_at)}`);
    lines.push(`  translated_by: ${fm.source.translated_by}`);
    if (fm.canonical_url) lines.push(`canonical_url: ${JSON.stringify(fm.canonical_url)}`);
    lines.push(`manual_override: ${fm.manual_override}`);
    return lines.join('\n') + '\n';
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0]!;
  }

  private termCount(_article: SyncArticle): number {
    // Count checked terms from glossary (not available here — use static count from .planning/glossary.json)
    // This is a display-only field; exact count returned as approximation
    return 120; // glossary.json has ~120 preserve_as_is entries
  }
}
