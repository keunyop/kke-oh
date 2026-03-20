import assert from 'node:assert/strict';
import test from 'node:test';
import { isPointPurchaseAutoApproveEnabled } from './lib/points/service';

test('point purchases auto-approve by default during the test phase', () => {
  const original = process.env.POINT_PURCHASE_AUTO_APPROVE;

  delete process.env.POINT_PURCHASE_AUTO_APPROVE;
  assert.equal(isPointPurchaseAutoApproveEnabled(), true);

  process.env.POINT_PURCHASE_AUTO_APPROVE = 'false';
  assert.equal(isPointPurchaseAutoApproveEnabled(), false);

  process.env.POINT_PURCHASE_AUTO_APPROVE = 'true';
  assert.equal(isPointPurchaseAutoApproveEnabled(), true);

  if (original === undefined) {
    delete process.env.POINT_PURCHASE_AUTO_APPROVE;
  } else {
    process.env.POINT_PURCHASE_AUTO_APPROVE = original;
  }
});
