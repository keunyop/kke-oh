export function normalizeLoginId(value) {
    return value.trim().normalize('NFKC').toLowerCase();
}
export function sanitizeLoginId(value) {
    return value.trim().normalize('NFKC');
}
