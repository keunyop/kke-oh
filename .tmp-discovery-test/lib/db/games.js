import { createServiceClient } from '@/lib/db/supabase';
export async function canUploadByIp(ipHash) {
    const supabase = createServiceClient();
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
        .from('upload_events')
        .select('*', { count: 'exact', head: true })
        .eq('uploader_ip_hash', ipHash)
        .gte('created_at', tenMinAgo);
    if ((recentCount ?? 0) >= 1) {
        return { ok: false, reason: 'Only one upload allowed per 10 minutes.' };
    }
    const { count: dailyCount } = await supabase
        .from('upload_events')
        .select('*', { count: 'exact', head: true })
        .eq('uploader_ip_hash', ipHash)
        .gte('created_at', dayAgo);
    if ((dailyCount ?? 0) >= 3) {
        return { ok: false, reason: 'Daily upload limit reached for this IP.' };
    }
    return { ok: true };
}
export async function isBlocked(emailHash, ipHash) {
    const supabase = createServiceClient();
    const { data } = await supabase
        .from('blocklist')
        .select('id')
        .or(`value_hash_or_value.eq.${emailHash},value_hash_or_value.eq.${ipHash}`)
        .limit(1);
    return Boolean(data && data.length > 0);
}
