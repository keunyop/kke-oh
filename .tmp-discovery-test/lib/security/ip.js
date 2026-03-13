import { headers } from 'next/headers';
export function getRequestIp() {
    const h = headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return h.get('x-real-ip') ?? '0.0.0.0';
}
