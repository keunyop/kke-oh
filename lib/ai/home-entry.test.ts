import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAiDraftLaunchPath, normalizeAiPrefillPrompt } from './home-entry';

test('normalizeAiPrefillPrompt trims whitespace and caps long prompts', () => {
  const longPrompt = `  ${'a'.repeat(1400)}  `;
  const normalized = normalizeAiPrefillPrompt(longPrompt);

  assert.equal(normalized.length, 1200);
  assert.equal(normalized, 'a'.repeat(1200));
});

test('buildAiDraftLaunchPath keeps AI prompt and model in the submit URL', () => {
  const path = buildAiDraftLaunchPath({
    prompt: 'Make a coin game',
    modelId: 'gpt-5-mini'
  });

  assert.equal(path, '/submit?aiPrompt=Make+a+coin+game&aiModel=gpt-5-mini');
});
