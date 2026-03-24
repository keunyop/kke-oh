import assert from 'node:assert/strict';
import test from 'node:test';
import { getPrimaryOwnerAction, getPrimaryOwnerActionClassName, shouldRenderPrimaryOwnerActionFirst } from './owner-actions';

test('draft games prioritize publish and render it first', () => {
  const game = { status: 'DRAFT' as const, is_hidden: false };

  assert.equal(getPrimaryOwnerAction(game), 'publish');
  assert.equal(getPrimaryOwnerActionClassName('publish'), 'button-primary');
  assert.equal(shouldRenderPrimaryOwnerActionFirst(game), true);
});

test('hidden games surface unhide without the publish emphasis', () => {
  const game = { status: 'PUBLIC' as const, is_hidden: true };

  assert.equal(getPrimaryOwnerAction(game), 'unhide');
  assert.equal(getPrimaryOwnerActionClassName('unhide'), 'button-ghost');
  assert.equal(shouldRenderPrimaryOwnerActionFirst(game), false);
});

test('published visible games keep hide as the later secondary action', () => {
  const game = { status: 'PUBLIC' as const, is_hidden: false };

  assert.equal(getPrimaryOwnerAction(game), 'hide');
  assert.equal(getPrimaryOwnerActionClassName('hide'), 'button-secondary');
  assert.equal(shouldRenderPrimaryOwnerActionFirst(game), false);
});
