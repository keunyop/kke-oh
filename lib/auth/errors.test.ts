import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthError, translateAuthError } from './errors';

test('translateAuthError returns localized duplicate ID messages', () => {
  assert.equal(translateAuthError(new AuthError('duplicate_login_id'), 'ko', 'signup_failed'), '이미 사용 중인 ID예요.');
  assert.equal(translateAuthError(new AuthError('duplicate_login_id'), 'en', 'signup_failed'), 'That ID is already being used.');
});

test('translateAuthError falls back to localized login failure copy', () => {
  assert.equal(translateAuthError(null, 'ko', 'login_failed'), '로그인을 완료하지 못했어요.');
  assert.equal(translateAuthError(null, 'en', 'login_failed'), 'Could not finish logging in.');
});

