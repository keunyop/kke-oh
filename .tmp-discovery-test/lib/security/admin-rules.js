function normalizeLoginId(value) {
    return value.trim().normalize('NFKC').toLowerCase();
}
const ADMIN_LOGIN_IDS = new Set(['kylee1112@hotmail.com', 'jaden'].map((loginId) => normalizeLoginId(loginId)));
export function isAdminLoginId(loginId) {
    if (!loginId)
        return false;
    return ADMIN_LOGIN_IDS.has(normalizeLoginId(loginId));
}
export function isAdminUser(user) {
    return isAdminLoginId(user?.loginId);
}
