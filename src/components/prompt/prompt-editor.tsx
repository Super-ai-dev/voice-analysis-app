import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function PromptEditor() {
  const { user } = useAppStore();
  const [serviceEvalPrompt, setServiceEvalPrompt] = useState('');
  const [customerInsightPrompt, setCustomerInsightPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{service: string, customer: string}>({
    service: '',
    customer: ''
  });

  // プロンプトの初期ロード
  useEffect(() => {
    if (user) {
      loadPrompts();

      // リアルタイム更新のサブスクリプション
      const subscription = supabase
        .channel('system_prompts_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'system_prompts'
        }, () => {
          // 変更があった場合はプロンプトを再読み込み
          loadPrompts();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // 接客評価プロンプト
        const serviceEval = data.find(p => p.prompt_type === 'service_evaluation');
        if (serviceEval) {
          setServiceEvalPrompt(serviceEval.prompt_text);
        }

        // 顧客インサイトプロンプト
        const customerInsight = data.find(p => p.prompt_type === 'customer_insight');
        if (customerInsight) {
          setCustomerInsightPrompt(customerInsight.prompt_text);
        }
      }
    } catch (err: any) {
      setError(err.message || 'プロンプトの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const saveServiceEvalPrompt = async () => {
    if (!serviceEvalPrompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setSaveStatus(prev => ({ ...prev, service: 'saving' }));

      console.log('接客評価プロンプトを保存します...');

      // 既存のプロンプトを確認
      const { data, error: fetchError } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('prompt_type', 'service_evaluation')
        .maybeSingle();

      if (fetchError) {
        console.error('既存プロンプト取得エラー:', fetchError);
        throw fetchError;
      }

      let result;

      if (data) {
        console.log('既存のプロンプトを更新します:', data.id);
        // 既存のプロンプトを更新
        result = await supabase
          .from('system_prompts')
          .update({
            prompt_text: serviceEvalPrompt,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
      } else {
        console.log('新規プロンプトを作成します');
        // 新規プロンプトを作成
        result = await supabase
          .from('system_prompts')
          .insert({
            prompt_type: 'service_evaluation',
            prompt_text: serviceEvalPrompt
          });
      }

      if (result.error) {
        console.error('保存エラー:', result.error);
        throw result.error;
      }

      console.log('接客評価プロンプトの保存に成功しました');
      setSaveStatus(prev => ({ ...prev, service: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, service: '' }));
      }, 2000);
    } catch (err: any) {
      console.error('接客評価プロンプト保存エラー:', err);
      setError(err.message || '接客評価プロンプトの保存に失敗しました');
      setSaveStatus(prev => ({ ...prev, service: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomerInsightPrompt = async () => {
    if (!customerInsightPrompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setSaveStatus(prev => ({ ...prev, customer: 'saving' }));

      console.log('顧客インサイトプロンプトを保存します...');

      // 既存のプロンプトを確認
      const { data, error: fetchError } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('prompt_type', 'customer_insight')
        .maybeSingle();

      if (fetchError) {
        console.error('既存プロンプト取得エラー:', fetchError);
        throw fetchError;
      }

      let result;

      if (data) {
        console.log('既存のプロンプトを更新します:', data.id);
        // 既存のプロンプトを更新
        result = await supabase
          .from('system_prompts')
          .update({
            prompt_text: customerInsightPrompt,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
      } else {
        console.log('新規プロンプトを作成します');
        // 新規プロンプトを作成
        result = await supabase
          .from('system_prompts')
          .insert({
            prompt_type: 'customer_insight',
            prompt_text: customerInsightPrompt
          });
      }

      if (result.error) {
        console.error('保存エラー:', result.error);
        throw result.error;
      }

      console.log('顧客インサイトプロンプトの保存に成功しました');
      setSaveStatus(prev => ({ ...prev, customer: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, customer: '' }));
      }, 2000);
    } catch (err: any) {
      console.error('顧客インサイトプロンプト保存エラー:', err);
      setError(err.message || '顧客インサイトプロンプトの保存に失敗しました');
      setSaveStatus(prev => ({ ...prev, customer: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>接客評価プロンプト</CardTitle>
          <CardDescription>
            音声から接客評価を生成するためのプロンプトを設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={serviceEvalPrompt}
            onChange={(e) => setServiceEvalPrompt(e.target.value)}
            placeholder="接客評価のプロンプトを入力してください"
            className="min-h-[200px]"
            disabled={isLoading}
          />
          {saveStatus.service === 'error' && (
            <p className="text-red-500 mt-2">保存に失敗しました</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={saveServiceEvalPrompt}
            disabled={isLoading || !serviceEvalPrompt.trim()}
          >
            {saveStatus.service === 'saving' ? '保存中...' :
             saveStatus.service === 'saved' ? '保存しました' : '保存'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>顧客インサイトプロンプト</CardTitle>
          <CardDescription>
            音声から顧客インサイトを抽出するためのプロンプトを設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customerInsightPrompt}
            onChange={(e) => setCustomerInsightPrompt(e.target.value)}
            placeholder="顧客インサイトのプロンプトを入力してください"
            className="min-h-[200px]"
            disabled={isLoading}
          />
          {saveStatus.customer === 'error' && (
            <p className="text-red-500 mt-2">保存に失敗しました</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={saveCustomerInsightPrompt}
            disabled={isLoading || !customerInsightPrompt.trim()}
          >
            {saveStatus.customer === 'saving' ? '保存中...' :
             saveStatus.customer === 'saved' ? '保存しました' : '保存'}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">エラーが発生しました</p>
          <p>{error}</p>
          <p className="text-sm mt-2">
            エラーが続く場合は、Supabaseで「system_prompts」テーブルが作成されているか確認してください。
            <br />
            テーブルが存在しない場合は、SQLエディタで以下のクエリを実行してください：
          </p>
          <pre className="bg-gray-100 p-2 mt-2 text-xs overflow-auto">
            {`CREATE TABLE IF NOT EXISTS public.system_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_type TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
          </pre>
        </div>
      )}
    </div>
  );
}
