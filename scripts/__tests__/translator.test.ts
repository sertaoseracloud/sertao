import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Translator } from '../translator.ts';

describe('Translator', () => {
  describe('splitSections', () => {
    it('splits markdown on H2 headings', () => {
      const md = 'Intro paragraph.\n\n## Section One\n\ncontent\n\n## Section Two\n\nmore';
      const translator = new Translator(null as any, null as any);
      const sections = translator.splitSections(md);
      assert.equal(sections.length, 3);
      assert.ok(sections[1].startsWith('## Section One'));
      assert.ok(sections[2].startsWith('## Section Two'));
    });

    it('splits markdown on H3 headings', () => {
      const md = '## Parent\n\ncontent\n\n### Child\n\nchild content';
      const translator = new Translator(null as any, null as any);
      const sections = translator.splitSections(md);
      assert.equal(sections.length, 2);
      assert.ok(sections[1].startsWith('### Child'));
    });

    it('returns single section for content with no H2/H3 headings', () => {
      const md = '# Title\n\nParagraph without subheadings.';
      const translator = new Translator(null as any, null as any);
      const sections = translator.splitSections(md);
      assert.equal(sections.length, 1);
    });
  });

  describe('translatePost', () => {
    it('calls Anthropic client once per section and assembles result', async () => {
      const mockClient = {
        messages: {
          create: mock.fn(async () => ({
            content: [{ type: 'text', text: '# Traduzido\n\nConteúdo.' }],
            usage: { input_tokens: 100, output_tokens: 50 },
          })),
        },
      };
      const translator = new Translator(mockClient as any, { preserve_as_is: ['AWS'] } as any);
      const result = await translator.translatePost('## Section One\n\ncontent');
      assert.ok(result.translated.includes('Traduzido'));
      assert.equal(mockClient.messages.create.mock.calls.length, 1);
      assert.equal(result.sectionsCount, 1);
    });

    it('returns token usage aggregated across all sections', async () => {
      const mockClient = {
        messages: {
          create: mock.fn(async () => ({
            content: [{ type: 'text', text: '## S\n\nt' }],
            usage: { input_tokens: 10, output_tokens: 5 },
          })),
        },
      };
      const translator = new Translator(mockClient as any, { preserve_as_is: [] } as any);
      const md = '## Section A\n\nA\n\n## Section B\n\nB';
      const result = await translator.translatePost(md);
      assert.equal(result.inputTokens, 20);
      assert.equal(result.outputTokens, 10);
      assert.equal(result.sectionsCount, 2);
    });
  });
});
