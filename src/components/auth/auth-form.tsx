import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthForm() {
  const { setUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleDemoLogin = () => {
    setIsLoading(true);

    // デモユーザーを作成
    setTimeout(() => {
      setUser({
        id: 'demo-user-id',
        email: 'demo@example.com',
        user_metadata: {
          name: 'デモユーザー',
        },
      });
      setIsLoading(false);
      toast.success('デモモードでログインしました');
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('ログインしました');
    } catch (error: any) {
      toast.error(error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast.success('アカウントが作成されました。ログインしてください。');
      setAuthMode('login');
    } catch (error: any) {
      toast.error(error.message || 'アカウント作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>SalonTalk Insight Analyzer</CardTitle>
        <CardDescription>
          美容サロン向け音声接客解析システム
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isDemo ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 text-sm">
              <p className="font-medium">デモモード</p>
              <p className="mt-1">Supabaseの設定がされていないため、デモモードで動作しています。</p>
              <p className="mt-1">デモモードではデータは保存されません。</p>
            </div>
            <Button
              className="w-full"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              {isLoading ? '処理中...' : 'デモモードでログイン'}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="signup">新規登録</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレスを入力"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">パスワード</label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? '処理中...' : 'ログイン'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="signup-email" className="text-sm font-medium">メールアドレス</label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレスを入力"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-medium">パスワード</label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力（6文字以上）"
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? '処理中...' : 'アカウント作成'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      {!isDemo && (
        <CardFooter>
          <p className="text-sm text-center w-full text-gray-500">
            {authMode === 'login'
              ? 'アカウントをお持ちでない場合は、「新規登録」タブからアカウントを作成してください。'
              : 'すでにアカウントをお持ちの場合は、「ログイン」タブからログインしてください。'}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
