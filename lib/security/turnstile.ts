import { getEnv } from '@/lib/config';

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!token) return false;

  const formData = new URLSearchParams();
  formData.append('secret', getEnv('TURNSTILE_SECRET_KEY'));
  formData.append('response', token);
  formData.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) return false;
  const json = (await response.json()) as { success?: boolean };
  return Boolean(json.success);
}
