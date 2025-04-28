import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { EyeIcon, EyeOffIcon, CopyIcon, CheckIcon } from 'lucide-react';

type Provider = 'openai' | 'gemini' | 'groq';

export default function ApiKeyManager() {
  const { user, apiKeys, addApiKey, updateApiKey, deleteApiKey } = useAppStore();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<Provider, boolean>>({
    openai: false,
    gemini: false,
    groq: false,
  });
  const [copied, setCopied] = useState<Record<Provider, boolean>>({
    openai: false,
    gemini: false,
    groq: false,
  });

  // APIキーの初期ロード
  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('created_by', user.id);

      if (error) throw error;

      // ローカルステートを更新
      data.forEach(key => {
        addApiKey({
          provider: key.provider as Provider,
          key: '••••••••••••••••••••••••••', // マスク表示
        });
      });
    } catch (err: any) {
      setError(err.message || 'APIキーの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!user || !selectedProvider || !apiKey.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // 既存のキーを確認
      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('provider', selectedProvider)
        .eq('created_by', user.id);

      if (fetchError) throw fetchError;

      // キーのハッシュ化（実際の実装ではサーバーサイドで行うべき）
      const keyHash = apiKey; // 実際にはハッシュ化する

      if (data && data.length > 0) {
        // 既存のキーを更新
        const { error } = await supabase
          .from('api_keys')
          .update({
            key_hash: keyHash,
          })
          .eq('id', data[0].id);

        if (error) throw error;
      } else {
        // 新しいキーを作成
        const { error } = await supabase
          .from('api_keys')
          .insert({
            provider: selectedProvider,
            key_hash: keyHash,
            created_by: user.id,
          });

        if (error) throw error;
      }

      // ローカルステートを更新
      addApiKey({
        provider: selectedProvider,
        key: '••••••••••••••••••••••••••', // マスク表示
      });

      // フォームをリセット
      setApiKey('');
      setSelectedProvider(null);
      setIsDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'APIキーの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (provider: Provider) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Supabaseから削除
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('provider', provider)
        .eq('created_by', user.id);

      if (error) throw error;

      // ローカルステートを更新
      deleteApiKey(provider);
    } catch (err: any) {
      setError(err.message || 'APIキーの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = async (provider: Provider) => {
    try {
      // 実際の実装では、サーバーから一度だけ取得できるようにする
      const { data, error } = await supabase
        .from('api_keys')
        .select('key_hash')
        .eq('provider', provider)
        .eq('created_by', user.id)
        .single();

      if (error) throw error;

      await navigator.clipboard.writeText(data.key_hash);

      // コピー状態を更新
      setCopied(prev => ({ ...prev, [provider]: true }));

      // 3秒後にリセット
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [provider]: false }));
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'APIキーのコピーに失敗しました');
    }
  };

  const toggleShowKey = (provider: Provider) => {
    setShowKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const providerNames: Record<Provider, string> = {
    openai: 'OpenAI',
    gemini: 'Google AI (Gemini)',
    groq: 'Groq',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>APIキー管理</CardTitle>
        <CardDescription>
          各プロバイダーのAPIキーを管理します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(['openai', 'gemini', 'groq'] as Provider[]).map((provider) => {
            const key = apiKeys.find(k => k.provider === provider);
            return (
              <div key={provider} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{providerNames[provider]}</h3>
                  {key ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleShowKey(provider)}
                      >
                        {showKey[provider] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyApiKey(provider)}
                      >
                        {copied[provider] ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteApiKey(provider)}
                      >
                        削除
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setIsDialogOpen(true);
                      }}
                    >
                      追加
                    </Button>
                  )}
                </div>
                {key && (
                  <div className="mt-2">
                    <code className="text-sm bg-gray-100 p-1 rounded">
                      {showKey[provider] ? '表示できません（セキュリティのため）' : '••••••••••••••••••••••••••'}
                    </code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>APIキーの追加</DialogTitle>
              <DialogDescription>
                {selectedProvider && providerNames[selectedProvider]}のAPIキーを追加します
              </DialogDescription>
            </DialogHeader>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="APIキーを入力"
              type="password"
            />
            <DialogFooter>
              <Button
                onClick={handleSaveApiKey}
                disabled={isLoading || !apiKey.trim()}
              >
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
