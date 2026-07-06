export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
}

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[env] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 비어있습니다. .env 를 확인하세요.')
}
