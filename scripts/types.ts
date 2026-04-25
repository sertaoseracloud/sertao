import type { EnforcerResult } from './glossary-enforcer.ts';

export interface SyncArticle {
  id: number;
  slug: string;
  title: string;
  description: string;
  pubDate: string; // ISO date string
  tags: string[];
  coverImageUrl: string | null;
  coverAlt: string | null;
  canonicalUrl: string | null;
  bodyMarkdownHash: string;
  translatedBody: string;
  sectionsCount: number;
  inputTokens: number;
  outputTokens: number;
  enforcerResult: EnforcerResult;
}

export interface PipelineHandlers {
  maxTranslations: number;
  onTranslate?: (id: number) => void;
  onSkip?: (id: number) => void;
  translate: (markdown: string) => Promise<{
    translated: string;
    sectionsCount: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  enforce: (enSource: string, ptOutput: string) => EnforcerResult;
  writePost: (article: SyncArticle) => Promise<void>;
  openPr: (article: SyncArticle) => Promise<string>;
  openIssue: (title: string, body: string) => Promise<void>;
}
