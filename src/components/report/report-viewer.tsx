import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function ReportViewer() {
  const { user, reports, audioUploads } = useAppStore();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // レポートの初期ロード
  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    try {
      setIsLoading(true);

      // 音声アップロードデータを取得
      const { data: audioData, error: audioError } = await supabase
        .from('audio_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (audioError) throw audioError;

      // レポートデータを取得
      const { data: reportData, error: reportError } = await supabase
        .from('insight_reports')
        .select('*')
        .in('audio_id', audioData.map(a => a.id))
        .order('created_at', { ascending: false });

      if (reportError) throw reportError;

      // 最初のレポートを選択
      if (reportData.length > 0) {
        setSelectedReportId(reportData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'レポートの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedReport = reports.find(r => r.id === selectedReportId) || (reports.length > 0 ? reports[0] : null);

  return (
    <div className="space-y-4">
      <div className="md-file-explorer border rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-3">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            レポート一覧
          </h2>
          <p className="text-sm text-gray-500 mt-1">生成されたレポートの一覧です</p>
        </div>

        <div className="bg-white">
          {reports.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>レポートがありません</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => {
                const audio = audioUploads.find(a => a.id === report.audioId);
                return (
                  <div
                    key={report.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedReportId === report.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedReportId(report.id)}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{audio?.fileName || '不明なファイル'}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP') : '日時不明'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 ml-2">
                        {report.provider === 'openai' ? 'GPT-4o' :
                         report.provider === 'gemini' ? 'Gemini' : 'Llama3'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {error && <p className="text-red-500 p-4">{error}</p>}
        </div>
      </div>

      {selectedReport && (
        <div className="md-preview-container border rounded-lg shadow-md overflow-hidden">
          {/* マークダウンエディタのようなヘッダー */}
          <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-700">
                {audioUploads.find(a => a.id === selectedReport.audioId)?.fileName || '不明なファイル'}
                {selectedReport.createdAt && ` - ${new Date(selectedReport.createdAt).toLocaleString('ja-JP')}`}
              </span>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
              {selectedReport.provider === 'openai' ? 'GPT-4o' :
               selectedReport.provider === 'gemini' ? 'Gemini' : 'Llama3'}
            </span>
          </div>

          {/* タブ付きマークダウンプレビュー本体 */}
          <div className="bg-white p-6 overflow-auto">
            <Tabs defaultValue="service" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="service">接客評価</TabsTrigger>
                <TabsTrigger value="customer">顧客インサイト</TabsTrigger>
              </TabsList>

              <TabsContent value="service" className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-600 prose-strong:font-bold prose-em:text-gray-600 prose-code:bg-gray-100 prose-code:p-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-li:marker:text-gray-500 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2 prose-td:border prose-td:border-gray-300 prose-td:p-2">
                <div className="markdown-body">
                  <ReactMarkdown>
                    {selectedReport.content.split('# 顧客インサイト')[0].replace('# 接客評価', '')}
                  </ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="customer" className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-600 prose-strong:font-bold prose-em:text-gray-600 prose-code:bg-gray-100 prose-code:p-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-li:marker:text-gray-500 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2 prose-td:border prose-td:border-gray-300 prose-td:p-2">
                <div className="markdown-body">
                  <ReactMarkdown>
                    {selectedReport.content.includes('# 顧客インサイト')
                      ? selectedReport.content.split('# 顧客インサイト')[1]
                      : '顧客インサイトのデータがありません'}
                  </ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
