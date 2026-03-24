import assert from 'node:assert/strict';
import test from 'node:test';
import { AI_CREATE_PROGRESS_STEP_DELAYS, getAiCreateProgressCopy } from './create-progress';

test('AI create progress delays stay in ascending order for the stepper', () => {
  assert.deepEqual(AI_CREATE_PROGRESS_STEP_DELAYS, [8000, 26000, 52000, 78000]);
});

test('AI create progress copy includes five user-facing steps in Korean and English', () => {
  assert.equal(getAiCreateProgressCopy('ko').length, 5);
  assert.equal(getAiCreateProgressCopy('en').length, 5);
  assert.match(getAiCreateProgressCopy('ko')[0], /게임 아이디어/);
  assert.match(getAiCreateProgressCopy('en')[0], /Reading your idea/);
});
