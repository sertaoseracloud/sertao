import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashMarkdown } from '../diff-detector.ts';

describe('DiffDetector', () => {
  it('produces identical hashes for LF and CRLF versions of the same content', () => {
    const lf = '# Hello\nWorld\n';
    const crlf = '# Hello\r\nWorld\r\n';
    assert.equal(hashMarkdown(lf), hashMarkdown(crlf));
  });

  it('produces different hashes for different content', () => {
    assert.notEqual(hashMarkdown('# Hello'), hashMarkdown('# World'));
  });

  it('normalizes leading and trailing whitespace before hashing', () => {
    assert.equal(hashMarkdown('  # Hello  '), hashMarkdown('# Hello'));
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashMarkdown('# Test');
    assert.match(hash, /^[0-9a-f]{64}$/);
  });
});
