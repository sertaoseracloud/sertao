import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { DevToClient } from './devto-client.ts';
import { hashMarkdown } from './diff-detector.ts';
import { Translator } from './translator.ts';
import { enforceGlossary } from './glossary-enforcer.ts';
import { PRBuilder } from './pr-builder.ts';
import type { PipelineHandlers, SyncArticle } from './types.ts';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEVTO_USERNAME = 'sertaoseracloud';
const REPO = 'sertaoseracloud/blog_sertao';
const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'posts');
const IMAGES_DIR = path.join(process.cwd(), 'src', 'content', 'posts', 'images');
const GLOSSARY_PATH = path.join(process.cwd(), '.planning', 'glossary.json');

// ─── Pipeline orchestrator (exported for testability) ─────────────────────────

/**
 * Processes a list of articles through the sync pipeline with dependency injection.
 * Exported so sync-pipeline.test.ts can inject mock handlers for unit testing.
 *
 * Decision ordering (per CONTEXT.md):
 * 1. Skip if manualOverride:true (D-03)
 * 2. Skip if hasChanged:false (DiffDetector)
 * 3. Apply circuit breaker (D-08) — count eligible articles
 * 4. Translate (Translator)
 * 5. GlossaryEnforcer (D-09) — hard fail per article, open issue, continue
 * 6. Canonical lint (D-06) — open issue, non-blocking
 * 7. Write post file (PRBuilder)
 * 8. Open draft PR if GITHUB_TOKEN present (D-02, D-05)
 */
export async function processArticles(
  articles: Array<{
    id: number;
    slug: string;
    hasChanged: boolean;
    manualOverride: boolean;
    title?: string;
    description?: string;
    pubDate?: string;
    tags?: string[];
    coverImageUrl?: string | null;
    coverAlt?: string | null;
    canonicalUrl?: string | null;
    bodyMarkdown?: string;
  }>,
  handlers: PipelineHandlers,
): Promise<void> {
  let translatedCount = 0;

  for (const article of articles) {
    // D-03: skip manual_override
    if (article.manualOverride) {
      console.log(`[sync] SKIP article id=${article.id} slug=${article.slug} reason=manual_override`);
      handlers.onSkip?.(article.id);
      continue;
    }

    // Skip unchanged content
    if (!article.hasChanged) {
      console.log(`[sync] SKIP article id=${article.id} slug=${article.slug} reason=unchanged`);
      continue;
    }

    // D-08: circuit breaker
    if (translatedCount >= handlers.maxTranslations) {
      console.log(`[sync] Circuit breaker: MAX_TRANSLATIONS_PER_RUN=${handlers.maxTranslations} reached. Stopping.`);
      break;
    }

    try {
      // Translate
      const { translated, sectionsCount, inputTokens, outputTokens } = await handlers.translate(
        article.bodyMarkdown ?? '',
      );

      // GlossaryEnforcer (D-09)
      const enforcerResult = handlers.enforce(article.bodyMarkdown ?? '', translated);
      if (!enforcerResult.passed) {
        const issueTitle = `[glossary-drift] Translation drift detected for "${article.title ?? article.slug}"`;
        const issueBody = `## Glossary Drift Detected\n\n**Article:** ${article.title ?? article.slug} (dev.to #${article.id})\n\n**Drifted terms:**\n${enforcerResult.driftedTerms.map((t) => `- ${t}`).join('\n')}\n\n**Resolution:** Review the translation and update \`.planning/glossary.json\` if needed. Then re-run the sync pipeline.`;
        await handlers.openIssue(issueTitle, issueBody);
        console.error(`[sync] GLOSSARY DRIFT for id=${article.id}. Issue opened. Skipping PR.`);
        continue; // D-09: skip PR for this article; continue with others
      }

      // Canonical lint (D-06, D-07)
      const canonicalUrl = article.canonicalUrl;
      let canonicalIssueUrl: string | undefined;
      if (!canonicalUrl?.startsWith('https://sertaoseracloud.com/posts/')) {
        const issueTitle = `[canonical] Set canonical_url for "${article.title ?? article.slug}" on dev.to`;
        const issueBody = `## Action Required: Set Canonical URL\n\nThe article **${article.title ?? article.slug}** (dev.to #${article.id}) does not have a \`canonical_url\` pointing to the blog.\n\n**Required value:** \`https://sertaoseracloud.com/posts/${article.slug}\`\n\n**How to fix:** Go to the dev.to article settings and set the canonical URL to the value above.\n\n**Impact:** Without this, Google may rank dev.to above your blog for this content.`;
        canonicalIssueUrl = await handlers.openIssue(issueTitle, issueBody);
        console.warn(`[sync] canonical_url missing/incorrect for id=${article.id}. Issue opened (non-blocking).`);
      }

      const syncArticle: SyncArticle = {
        id: article.id,
        slug: article.slug,
        title: article.title ?? article.slug,
        description: article.description ?? '',
        pubDate: article.pubDate ?? new Date().toISOString().split('T')[0]!,
        tags: article.tags ?? [],
        coverImageUrl: article.coverImageUrl ?? null,
        coverAlt: article.coverAlt ?? null,
        canonicalUrl: canonicalUrl ?? null,
        canonicalIssueUrl: canonicalIssueUrl ?? null,
        bodyMarkdownHash: hashMarkdown(article.bodyMarkdown ?? ''),
        translatedBody: translated,
        sectionsCount,
        inputTokens,
        outputTokens,
        enforcerResult,
      };

      await handlers.writePost(syncArticle);

      const prUrl = await handlers.openPr(syncArticle);
      console.log(`[sync] PR opened: ${prUrl}`);

      handlers.onTranslate?.(article.id);
      translatedCount++;
    } catch (err) {
      console.error(`[sync] Failed to process article id=${article.id}:`, (err as Error).message);
      // Continue with next article
    }
  }

  console.log(`[sync] Run complete. Translated: ${translatedCount}/${handlers.maxTranslations} max.`);
}

// ─── Main entry point ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[sync-devto] Starting...');

  // ─── Environment guard (D-10: fail fast if ANTHROPIC_API_KEY missing) ──────────
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    console.error('[sync-devto] ANTHROPIC_API_KEY is not set. Aborting.');
    process.exit(1);
  }
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? null;
  const MAX_TRANSLATIONS_PER_RUN = Number(process.env.MAX_TRANSLATIONS_PER_RUN ?? '5');

  // Load glossary
  const glossaryJson = JSON.parse(await readFile(GLOSSARY_PATH, 'utf8'));

  // Initialize components
  const devToClient = new DevToClient();
  const anthropicClient = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    maxRetries: 3,
  });
  const translator = new Translator(anthropicClient, glossaryJson);
  const prBuilder = new PRBuilder(POSTS_DIR, IMAGES_DIR);

  // Fetch article listing
  const summaries = await devToClient.listArticles(DEVTO_USERNAME);
  console.log(`[sync-devto] Found ${summaries.length} articles for @${DEVTO_USERNAME}`);

  // Fetch full articles (per-article fetch for body_markdown)
  const fullArticles = [];
  for (const summary of summaries) {
    try {
      const full = await devToClient.getArticle(summary.id);
      fullArticles.push(full);
    } catch (err) {
      console.error(`[sync-devto] Failed to fetch article ${summary.id}:`, (err as Error).message);
    }
  }

  // Compute diff — read existing posts to check source.hash
  const articlesWithDiff = await Promise.all(
    fullArticles.map(async (article) => {
      const newHash = hashMarkdown(article.body_markdown);
      let existingHash: string | null = null;
      let manualOverride = false;
      try {
        const existing = await readFile(
          path.join(POSTS_DIR, `${article.slug}.md`),
          'utf8',
        );
        const hashMatch = existing.match(/hash:\s*"?([a-f0-9]{64})"?/);
        if (hashMatch) existingHash = hashMatch[1]!;
        manualOverride = /manual_override:\s*true/.test(existing);
      } catch {
        // File doesn't exist — new article
      }
      return {
        ...article,
        bodyMarkdown: article.body_markdown,
        coverImageUrl: article.cover_image,
        hasChanged: existingHash !== newHash,
        manualOverride,
      };
    }),
  );

  // Build pipeline handlers using real components
  const handlers: PipelineHandlers = {
    maxTranslations: MAX_TRANSLATIONS_PER_RUN,
    translate: (markdown) => translator.translatePost(markdown),
    enforce: (enSource, ptOutput) =>
      enforceGlossary(enSource, ptOutput, glossaryJson.preserve_as_is),
    writePost: (article) => prBuilder.writePost(article),
    openPr: async (article) => {
      if (!GITHUB_TOKEN) {
        console.log('[sync-devto] No GITHUB_TOKEN — skipping PR creation (local run).');
        return '(local run — no PR)';
      }
      return prBuilder.openGitHubPr(article, GITHUB_TOKEN, REPO);
    },
    openIssue: async (title, body) => {
      if (!GITHUB_TOKEN) {
        console.log(`[sync-devto] No GITHUB_TOKEN — would open issue: ${title}`);
        return undefined;
      }
      return prBuilder.openGitHubIssue(title, body, GITHUB_TOKEN, REPO);
    },
  };

  await processArticles(articlesWithDiff, handlers);
}

// Only run main() when this file is executed directly (not when imported by tests)
const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('sync-devto.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('sync-devto.js');

if (isMain) {
  main().catch((err) => {
    console.error('[sync-devto] Fatal error:', err);
    process.exit(1);
  });
}
