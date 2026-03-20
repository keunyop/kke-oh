import assert from 'node:assert/strict';
import test from 'node:test';
import { getFriendlyAiModelCopy } from './lib/ai/models';

test('friendly AI model copy hides the underlying provider model names', () => {
  const quick = getFriendlyAiModelCopy('gpt-4o-mini');
  const balanced = getFriendlyAiModelCopy('gpt-5-mini');
  const polished = getFriendlyAiModelCopy('gpt-5.4-mini');

  for (const item of [quick, balanced, polished]) {
    assert.doesNotMatch(item.label, /gpt/i);
    assert.doesNotMatch(item.kidDescription, /gpt/i);
  }

  assert.equal(quick.label, 'Quick Buddy');
  assert.equal(balanced.label, 'Smart Buddy');
  assert.equal(polished.label, 'Super Buddy');
});
