import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/config';

export function createServiceClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false }
  });
}

export function createAnonClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false }
  });
}
