import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';

export default function ProviderSettings() {
  const { sttProvider, llmProvider, setSttProvider, setLlmProvider } = useAppStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロバイダー設定</CardTitle>
        <CardDescription>
          音声認識とテキスト生成に使用するプロバイダーを選択します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">音声認識 (STT)</h3>
          <Tabs defaultValue={sttProvider} onValueChange={(value) => setSttProvider(value as 'openai' | 'groq')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openai">OpenAI Whisper</TabsTrigger>
              <TabsTrigger value="groq">Groq Whisper</TabsTrigger>
            </TabsList>
            <TabsContent value="openai" className="mt-2 text-sm text-gray-500">
              OpenAI Whisperは高精度な音声認識を提供します。日本語の認識精度が高く、多様なアクセントや背景ノイズにも強いのが特徴です。
            </TabsContent>
            <TabsContent value="groq" className="mt-2 text-sm text-gray-500">
              Groq Whisperは高速な音声認識を提供します。処理速度が速く、リアルタイムに近い応答が可能です。
              <p className="mt-1 text-amber-600">※ Groq WhisperはOpenAI APIキーも必要です。両方のAPIキーを設定してください。</p>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">テキスト生成 (LLM)</h3>
          <Tabs defaultValue={llmProvider} onValueChange={(value) => setLlmProvider(value as 'openai' | 'gemini' | 'groq')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="openai">GPT-4o</TabsTrigger>
              <TabsTrigger value="gemini">Gemini</TabsTrigger>
              <TabsTrigger value="groq">Llama3</TabsTrigger>
            </TabsList>
            <TabsContent value="openai" className="mt-2 text-sm text-gray-500">
              GPT-4oは最新のOpenAIモデルで、高度な理解力と生成能力を持ちます。美容業界の専門知識を活用した詳細なレポートを生成します。
            </TabsContent>
            <TabsContent value="gemini" className="mt-2 text-sm text-gray-500">
              Google AIのGeminiは、マルチモーダル能力に優れ、テキスト生成の品質が高いのが特徴です。コスト効率も良好です。
            </TabsContent>
            <TabsContent value="groq" className="mt-2 text-sm text-gray-500">
              Groqで提供されるLlama3は、オープンソースモデルをベースにした高速なLLMです。処理速度が非常に速く、コスト効率に優れています。
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
