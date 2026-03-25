import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdminPointBalanceChange, normalizeAdminPointBalanceInput } from './service';

test('normalizeAdminPointBalanceInput accepts whole numbers zero or greater', () => {
  assert.equal(normalizeAdminPointBalanceInput(0), 0);
  assert.equal(normalizeAdminPointBalanceInput(12), 12);
  assert.equal(normalizeAdminPointBalanceInput('7'), 7);
});

test('normalizeAdminPointBalanceInput rejects invalid balances', () => {
  assert.throws(() => normalizeAdminPointBalanceInput(-1));
  assert.throws(() => normalizeAdminPointBalanceInput(1.5));
  assert.throws(() => normalizeAdminPointBalanceInput(''));
  assert.throws(() => normalizeAdminPointBalanceInput('abc'));
});

test('getAdminPointBalanceChange describes whether a balance should increase, decrease, or stay the same', () => {
  assert.deepEqual(getAdminPointBalanceChange(10, 10), { direction: 'none', delta: 0 });
  assert.deepEqual(getAdminPointBalanceChange(10, 14), { direction: 'increase', delta: 4 });
  assert.deepEqual(getAdminPointBalanceChange(10, 3), { direction: 'decrease', delta: 7 });
});
