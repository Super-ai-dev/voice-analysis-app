import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { transcribeWithWhisper, transcribeWithGroq, callOpenAI, callGemini, callGroq } from '@/lib/api-providers';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AudioUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const {
    user,
    sttProvider,
    llmProvider,
    addAudioUpload,
    addReport
  } = useAppStore();

  // システムプロンプト
  const [serviceEvalPrompt, setServiceEvalPrompt] = useState('');
  const [customerInsightPrompt, setCustomerInsightPrompt] = useState('');

  // APIキーとプロンプトを取得
  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchSystemPrompts();

      // リアルタイム更新のサブスクリプション
      const subscription = supabase
        .channel('system_prompts_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'system_prompts'
        }, () => {
          // 変更があった場合はプロンプトを再読み込み
          console.log('システムプロンプトが更新されました。再読み込みします。');
          fetchSystemPrompts();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('provider, key_hash')
        .eq('created_by', user.id);

      if (error) throw error;

      const keys: Record<string, string> = {};
      data.forEach(item => {
        keys[item.provider] = item.key_hash;
      });

      setApiKeys(keys);
    } catch (err) {
      console.error('APIキーの取得に失敗しました:', err);
    }
  };

  const fetchSystemPrompts = async () => {
    try {
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
    } catch (err) {
      console.error('システムプロンプトの取得に失敗しました:', err);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      setError('ユーザー情報が取得できません。再ログインしてください。');
      return;
    }

    // システムプロンプトの確認
    if (!serviceEvalPrompt || !customerInsightPrompt) {
      setError('システムプロンプトが設定されていません。管理画面でプロンプトを追加してください。');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // ファイルサイズチェック (25MB以下)
    if (file.size > 25 * 1024 * 1024) {
      setError('ファイルサイズは25MB以下にしてください');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);
      setProcessingStage('ファイルをアップロード中...');

      // Supabaseにアップロード
      // ファイル名から特殊文字や空白を削除
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${Date.now()}_${sanitizedFileName}`;
      // ユーザーIDフォルダ内にファイルを保存
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 50));
          },
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('ファイルアップロードエラー:', uploadError);
        throw new Error(`ファイルのアップロードに失敗しました: ${uploadError.message}`);
      }

      // 音声ファイルのメタデータをデータベースに保存
      const { data: audioData, error: audioError } = await supabase
        .from('audio_uploads')
        .insert({
          user_id: user.id,
          file_path: filePath,
          duration_sec: 0, // 実際には音声の長さを取得する必要があります
        })
        .select()
        .single();

      if (audioError) throw audioError;

      // アップロード完了、音声解析開始
      setIsUploading(false);
      setIsProcessing(true);
      setProgress(30);
      setProcessingStage('音声をテキストに変換中...');

      // APIキーの確認
      const sttApiKey = sttProvider === 'openai' ? apiKeys['openai'] : apiKeys['groq'];
      if (!sttApiKey) {
        throw new Error(`${sttProvider === 'openai' ? 'OpenAI' : 'Groq'} APIキーが設定されていません。設定画面から追加してください。`);
      }

      // 音声をテキストに変換
      let transcription;
      if (sttProvider === 'openai') {
        transcription = await transcribeWithWhisper(file, sttApiKey);
      } else {
        // Groq Whisperを選択した場合でも、OpenAIのAPIキーが必要です
        if (!apiKeys['openai']) {
          throw new Error('Groq Whisperを使用するには、OpenAI APIキーも設定する必要があります。設定画面から追加してください。');
        }
        transcription = await transcribeWithGroq(file, apiKeys['groq'], apiKeys['openai']);
      }

      setProgress(60);
      setProcessingStage('テキストを解析中...');

      // LLMのAPIキーの確認
      const llmApiKey = apiKeys[llmProvider];
      if (!llmApiKey) {
        throw new Error(`${llmProvider === 'openai' ? 'OpenAI' : llmProvider === 'gemini' ? 'Gemini' : 'Groq'} APIキーが設定されていません。設定画面から追加してください。`);
      }

      // LLMでテキストを解析（接客評価）
      let serviceEvalContent;
      if (llmProvider === 'openai') {
        serviceEvalContent = await callOpenAI(transcription, serviceEvalPrompt, llmApiKey);
      } else if (llmProvider === 'gemini') {
        serviceEvalContent = await callGemini(transcription, serviceEvalPrompt, llmApiKey);
      } else {
        serviceEvalContent = await callGroq(transcription, serviceEvalPrompt, llmApiKey);
      }

      setProgress(70);
      setProcessingStage('顧客インサイトを分析中...');

      // LLMでテキストを解析（顧客インサイト）
      let customerInsightContent;
      if (llmProvider === 'openai') {
        customerInsightContent = await callOpenAI(transcription, customerInsightPrompt, llmApiKey);
      } else if (llmProvider === 'gemini') {
        customerInsightContent = await callGemini(transcription, customerInsightPrompt, llmApiKey);
      } else {
        customerInsightContent = await callGroq(transcription, customerInsightPrompt, llmApiKey);
      }

      // 両方の結果を結合
      const reportContent = `
# 接客評価
${serviceEvalContent}

# 顧客インサイト
${customerInsightContent}
      `;

      setProgress(80);
      setProcessingStage('レポートを保存中...');

      // レポートをデータベースに保存
      const { data: reportData, error: reportError } = await supabase
        .from('insight_reports')
        .insert({
          audio_id: audioData.id,
          report_md: reportContent,
          provider: llmProvider,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // ローカルステートを更新
      addAudioUpload({
        id: audioData.id,
        fileName: file.name,
        duration: 0,
        createdAt: new Date(),
      });

      addReport({
        id: reportData.id,
        audioId: audioData.id,
        content: reportContent,
        provider: llmProvider,
        createdAt: new Date(),
      });

      setProgress(100);
      setProcessingStage('完了！レポートタブで確認できます');
      setIsProcessing(false);

      // 成功メッセージを表示
      toast.success('音声解析が完了しました', {
        description: 'レポートタブで結果を確認できます',
        duration: 5000,
      });
    } catch (err: any) {
      setError(err.message || '処理中にエラーが発生しました');
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [user, serviceEvalPrompt, customerInsightPrompt, sttProvider, llmProvider, addAudioUpload, addReport, apiKeys]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
    },
    maxFiles: 1,
    disabled: isUploading || isProcessing,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>音声ファイルをアップロード</CardTitle>
        <CardDescription>
          施術中の会話を録音した音声ファイルをアップロードしてください
        </CardDescription>
      </CardHeader>
      <CardContent>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          } ${isUploading || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {isUploading || isProcessing ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="font-medium">{processingStage || (isUploading ? 'アップロード中...' : '解析中...')}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{progress}% 完了</p>
            </div>
          ) : (
            <div>
              <p>
                {isDragActive
                  ? 'ここにファイルをドロップ'
                  : 'クリックまたはドラッグ&ドロップでファイルを選択'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                サポート形式: MP3, WAV, M4A, AAC (最大25MB)
              </p>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          disabled={isUploading || isProcessing}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          ファイルを選択
        </Button>
      </CardFooter>
    </Card>
  );
}
