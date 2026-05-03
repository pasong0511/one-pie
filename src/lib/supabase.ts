import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

if (!url || !key) {
  throw new Error(
    'Supabase 환경변수가 없어요. .env.local 에 VITE_SUPABASE_URL / VITE_SUPABASE_KEY 를 설정해주세요.',
  );
}

// 인증 없이 family_group_id 만으로 read/write — 친구 둘 프로토타입 모드.
// 본판에서는 auth.users + RLS 로 교체.
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
