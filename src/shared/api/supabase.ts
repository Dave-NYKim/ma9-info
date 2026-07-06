import { createClient } from '@supabase/supabase-js'
import { env } from '@shared/config/env'

/** 백엔드리스: 이 클라이언트가 곧 API. RLS가 권한을 강제. */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
