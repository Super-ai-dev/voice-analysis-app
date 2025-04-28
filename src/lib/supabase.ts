import { createClient } from '@supabase/supabase-js';

// 環境変数が設定されていない場合はデモモードで動作
const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = isDemo ? 'https://demo.supabase.co' : process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = isDemo ? 'demo-key' : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// デモモード用のモックSupabaseクライアント
const createMockClient = () => {
  // ローカルストレージをシミュレート
  const storage: Record<string, any> = {};

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: () => ({
        upload: async (path: string, file: File) => ({ data: { path }, error: null }),
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({
            limit: () => ({
              data: [],
              error: null,
            }),
          }),
          data: [],
          error: null,
        }),
        order: () => ({
          data: [],
          error: null,
        }),
        in: () => ({
          order: () => ({
            data: [],
            error: null,
          }),
        }),
        data: [],
        error: null,
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: { id: 'mock-id', created_at: new Date().toISOString() },
            error: null
          }),
        }),
      }),
      update: () => ({
        eq: () => ({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => ({ data: null, error: null }),
      }),
    }),
  };
};

// 環境変数が設定されていない場合はモッククライアントを使用
export const supabase = isDemo
  ? createMockClient() as any
  : createClient(supabaseUrl, supabaseAnonKey);
