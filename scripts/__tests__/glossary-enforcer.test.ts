import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { enforceGlossary } from '../glossary-enforcer.ts';

describe('GlossaryEnforcer', () => {
  it('PASS when all preserve_as_is terms appear at least as often in PT as EN', () => {
    const result = enforceGlossary('Use AWS Lambda and AWS S3', 'Use AWS Lambda e AWS S3', ['AWS', 'Lambda', 'S3']);
    assert.equal(result.passed, true);
    assert.deepEqual(result.driftedTerms, []);
  });

  it('FAIL when a term appears in EN but not in PT', () => {
    const result = enforceGlossary('Use Lambda for this task', 'Use Função para esta tarefa', ['Lambda']);
    assert.equal(result.passed, false);
    assert.equal(result.driftedTerms.length, 1);
    assert.ok(result.driftedTerms[0].startsWith('Lambda'));
  });

  it('PASS when a term does not appear in EN source (count zero is not drift)', () => {
    const result = enforceGlossary('No cloud services here', 'Sem serviços cloud aqui', ['Lambda']);
    assert.equal(result.passed, true);
  });

  it('driftedTerms entry contains EN count and PT count', () => {
    const result = enforceGlossary('AWS AWS', 'apenas AWS', ['AWS']);
    assert.equal(result.passed, false);
    assert.ok(result.driftedTerms[0].includes('EN: 2'));
    assert.ok(result.driftedTerms[0].includes('PT: 1'));
  });

  it('is case-sensitive: AWS and aws are different terms', () => {
    const result = enforceGlossary('Use AWS here', 'Use aws here', ['AWS']);
    assert.equal(result.passed, false);
  });
});
