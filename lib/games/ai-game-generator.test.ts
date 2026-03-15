import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGameGeneratorSystemPrompt } from './ai-game-generator';

test('buildGameGeneratorSystemPrompt emphasizes invention, reliability, and thumbnail quality', () => {
  const prompt = buildGameGeneratorSystemPrompt();

  assert.match(prompt, /If the user idea is short, vague, or incomplete/i);
  assert.match(prompt, /bug-resistant games/i);
  assert.match(prompt, /window\.kkeohSubmitScore\(score\)/);
  assert.match(prompt, /premium game key art/i);
  assert.match(prompt, /Avoid tiny UI, browser chrome, walls of text/i);
});
