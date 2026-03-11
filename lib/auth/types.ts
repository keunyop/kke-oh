export type AuthUser = {
  id: string;
  loginId: string;
  normalizedLoginId: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

export type AuthSession = {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

