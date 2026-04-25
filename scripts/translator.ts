import Anthropic from '@anthropic-ai/sdk';

// Minimal glossary shape needed by Translator
// Full type is derived from .planning/glossary.json structure
export interface GlossaryJson {
  preserve_as_is: string[];
  prefer_en_over_pt: Record<string, string>;
  never_translate: string[];
  style_notes: string[];
}

export interface TranslationResult {
  translated: string;
  sectionsCount: number;
  inputTokens: number;
  outputTokens: number;
}

export class Translator {
  private client: Anthropic;
  private glossary: GlossaryJson;

  constructor(client: Anthropic, glossary: GlossaryJson) {
    this.client = client;
    this.glossary = glossary;
  }

  /**
   * Split markdown on H2 (##) and H3 (###) headings.
   * Each heading stays with its section content.
   * D-01: section-by-section is one Haiku call each.
   */
  splitSections(markdown: string): string[] {
    return markdown.split(/(?=^#{2,3} )/m).filter((s) => s.trim().length > 0);
  }

  /**
   * Translate a full post section-by-section.
   * Sections are translated sequentially (not concurrent) to avoid rate limits.
   * SDK built-in retry handles 429/5xx with exponential backoff (maxRetries:3).
   */
  async translatePost(markdown: string): Promise<TranslationResult> {
    const sections = this.splitSections(markdown);
    const translatedSections: string[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const systemPrompt = this.buildSystemPrompt();

    for (const section of sections) {
      try {
        const response = await this.client.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: section }],
        });

        const text = (response.content[0] as Anthropic.TextBlock).text;
        translatedSections.push(text);
        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          // SDK already retried maxRetries times; log and propagate to skip this article
          console.error('[Translator] Rate limit exhausted after retries. Section skipped.');
          throw err;
        } else if (err instanceof Anthropic.APIConnectionError) {
          console.error('[Translator] Network error. Will retry on next cron run.');
          throw err;
        } else if (err instanceof Anthropic.BadRequestError) {
          // 400 — section malformed; do NOT retry
          console.error('[Translator] Bad request on section translation:', (err as Error).message);
          throw err;
        } else {
          throw err;
        }
      }
    }

    return {
      translated: translatedSections.join('\n\n'),
      sectionsCount: sections.length,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    };
  }

  private buildSystemPrompt(): string {
    const preserveList = (this.glossary.preserve_as_is ?? []).join(', ');
    const preferEnLines = Object.entries(this.glossary.prefer_en_over_pt ?? {})
      .map(([term, rule]) => `  - ${term}: ${rule}`)
      .join('\n');
    const neverTranslateLines = (this.glossary.never_translate ?? [])
      .map((rule) => `  - ${rule}`)
      .join('\n');
    const styleLines = (this.glossary.style_notes ?? [])
      .map((note) => `  - ${note}`)
      .join('\n');

    return `You are a technical translator specializing in EN→PT-BR for a cloud computing blog targeting senior Brazilian developers.

PRESERVE VERBATIM (do not translate these terms):
${preserveList}

PREFER ENGLISH OVER PORTUGUESE (follow these rules):
${preferEnLines}

NEVER TRANSLATE:
${neverTranslateLines}

STYLE GUIDELINES:
${styleLines}

Translate the following Markdown section from English to Brazilian Portuguese. Preserve all Markdown formatting, code blocks, inline code, URLs, and technical terms exactly as listed above. Return ONLY the translated Markdown with no explanation or meta-commentary.`;
  }
}
