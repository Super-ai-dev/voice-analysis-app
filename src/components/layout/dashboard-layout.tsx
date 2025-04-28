import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import AudioUpload from '@/components/audio/audio-upload';
import PromptEditor from '@/components/prompt/prompt-editor';
import ReportViewer from '@/components/report/report-viewer';
import ApiKeyManager from '@/components/settings/api-key-manager';
import ProviderSettings from '@/components/settings/provider-settings';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, setUser } = useAppStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">SalonTalk Insight Analyzer</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {user?.email}
            </div>
            <Avatar>
              <AvatarFallback>
                {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">音声アップロード</TabsTrigger>
            <TabsTrigger value="reports">レポート</TabsTrigger>
            <TabsTrigger value="prompts">プロンプト</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <AudioUpload />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportViewer />
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6">
            <PromptEditor />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ApiKeyManager />
              <ProviderSettings />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SalonTalk Insight Analyzer
        </div>
      </footer>
    </div>
  );
}
