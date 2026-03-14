import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { isGameTitleAvailable, resolveGameIdFromTitle, slugifyGameTitle } from './upload';

test('slugifyGameTitle keeps Korean letters and numbers', () => {
  assert.equal(slugifyGameTitle('별 피하기 2'), '별-피하기-2');
  assert.equal(slugifyGameTitle('Space Dodge'), 'space-dodge');
});

test('isGameTitleAvailable marks symbol-only titles as invalid', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));

  try {
    const result = await isGameTitleAvailable(tempDir, '!!!');
    assert.deepEqual(result, {
      gameId: '',
      available: false,
      issue: 'invalid'
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('isGameTitleAvailable detects an existing Korean game ID on the filesystem', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));
  const gameId = slugifyGameTitle('별 피하기');

  try {
    await fs.mkdir(path.join(tempDir, gameId), { recursive: true });

    const result = await isGameTitleAvailable(tempDir, '별 피하기');
    assert.deepEqual(result, {
      gameId,
      available: false,
      issue: 'taken'
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('resolveGameIdFromTitle rejects invalid titles', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));

  try {
    await assert.rejects(() => resolveGameIdFromTitle(tempDir, '---'), /Game name must include letters or numbers\./);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
