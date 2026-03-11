export function normalizeLoginId(value: string): string {
  return value.trim().normalize('NFKC').toLowerCase();
}

export function sanitizeLoginId(value: string): string {
  return value.trim().normalize('NFKC');
}
