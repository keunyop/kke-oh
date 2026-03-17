import type { Locale } from '@/lib/i18n';

export type AuthErrorCode =
  | 'login_id_length'
  | 'password_length'
  | 'duplicate_login_id'
  | 'invalid_credentials'
  | 'signup_failed'
  | 'login_failed';

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

function getAuthMessages(locale: Locale) {
  if (locale === 'ko') {
    return {
      login_id_length: 'ID는 2글자 이상 24글자 이하로 적어주세요.',
      password_length: '비밀번호는 2글자 이상 80글자 이하로 적어주세요.',
      duplicate_login_id: '이미 사용 중인 ID예요.',
      invalid_credentials: 'ID 또는 비밀번호를 다시 확인해주세요.',
      signup_failed: '회원가입을 완료하지 못했어요.',
      login_failed: '로그인을 완료하지 못했어요.'
    } satisfies Record<AuthErrorCode, string>;
  }

  return {
    login_id_length: 'Please use an ID between 2 and 24 characters.',
    password_length: 'Please use a password between 2 and 80 characters.',
    duplicate_login_id: 'That ID is already being used.',
    invalid_credentials: 'Please check your ID and password again.',
    signup_failed: 'Could not finish signing up.',
    login_failed: 'Could not finish logging in.'
  } satisfies Record<AuthErrorCode, string>;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function translateAuthError(error: unknown, locale: Locale, fallbackCode: AuthErrorCode) {
  const messages = getAuthMessages(locale);

  if (isAuthError(error)) {
    return messages[error.code];
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return messages[fallbackCode];
}

