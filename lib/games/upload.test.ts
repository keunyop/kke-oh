import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { isGameSlugAvailable, resolveGameSlug, slugifyGameSlug } from './upload';

test('slugifyGameSlug keeps only english letters, numbers, and hyphens', () => {
  assert.equal(slugifyGameSlug('별 피하기 2'), '2');
  assert.equal(slugifyGameSlug('Space Dodge'), 'space-dodge');
  assert.equal(slugifyGameSlug('Color Pop Mania'), 'color-pop-mania');
});

test('isGameSlugAvailable marks symbol-only slugs as invalid', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));

  try {
    const result = await isGameSlugAvailable(tempDir, '!!!');
    assert.deepEqual(result, {
      slug: '',
      available: false,
      issue: 'invalid'
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('isGameSlugAvailable detects an existing slug on the filesystem', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));
  const slug = slugifyGameSlug('Color Pop Mania');

  try {
    await fs.mkdir(path.join(tempDir, slug), { recursive: true });

    const result = await isGameSlugAvailable(tempDir, 'Color Pop Mania');
    assert.deepEqual(result, {
      slug,
      available: false,
      issue: 'taken'
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('isGameSlugAvailable finds a slug stored in game metadata', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));

  try {
    const gameDir = path.join(tempDir, '123e4567-e89b-12d3-a456-426614174000');
    await fs.mkdir(gameDir, { recursive: true });
    await fs.writeFile(
      path.join(gameDir, 'game.json'),
      `${JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174000', slug: 'color-pop-mania' })}\n`,
      'utf8'
    );

    const result = await isGameSlugAvailable(tempDir, 'color-pop-mania');
    assert.deepEqual(result, {
      slug: 'color-pop-mania',
      available: false,
      issue: 'taken'
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('resolveGameSlug rejects invalid slugs', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kkeoh-upload-'));

  try {
    await assert.rejects(() => resolveGameSlug(tempDir, '한글 이름'), /URL game name must use English letters, numbers, or hyphens\./);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
