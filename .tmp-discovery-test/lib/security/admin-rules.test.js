import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminLoginId, isAdminUser } from './admin-rules';
test('matches the configured admin login IDs regardless of case', () => {
    assert.equal(isAdminLoginId('kylee1112@hotmail.com'), true);
    assert.equal(isAdminLoginId('KYLEE1112@HOTMAIL.COM'), true);
    assert.equal(isAdminLoginId('jaden'), true);
    assert.equal(isAdminLoginId('JaDeN'), true);
});
test('rejects non-admin login IDs', () => {
    assert.equal(isAdminLoginId('someone-else'), false);
    assert.equal(isAdminLoginId(''), false);
    assert.equal(isAdminLoginId(undefined), false);
});
test('matches admin users from a loginId-bearing object', () => {
    assert.equal(isAdminUser({ loginId: 'jaden' }), true);
    assert.equal(isAdminUser({ loginId: 'player-one' }), false);
    assert.equal(isAdminUser(null), false);
});
