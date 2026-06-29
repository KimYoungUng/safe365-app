import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 URL과 API Key를 가져옵니다.
// VITE_ 로 시작하는 변수명만 Vite에서 접근 가능합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
