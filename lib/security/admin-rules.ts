type AdminUserLike = {
  loginId: string;
};

function normalizeLoginId(value: string): string {
  return value.trim().normalize('NFKC').toLowerCase();
}

const ADMIN_LOGIN_IDS = new Set(
  ['kylee1112@hotmail.com', 'jaden'].map((loginId) => normalizeLoginId(loginId))
);

export function isAdminLoginId(loginId: string | null | undefined): boolean {
  if (!loginId) return false;
  return ADMIN_LOGIN_IDS.has(normalizeLoginId(loginId));
}

export function isAdminUser(user: AdminUserLike | null | undefined): boolean {
  return isAdminLoginId(user?.loginId);
}
