import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import AudioUpload from '@/components/audio/audio-upload';
import ReportViewer from '@/components/report/report-viewer';
import { useRouter } from 'next/navigation';

interface UserDashboardLayoutProps {
  children?: ReactNode;
}

export default function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const { user, setUser } = useAppStore();
  const router = useRouter();

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

  const navigateToAdmin = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">SalonTalk Insight Analyzer</h1>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={navigateToAdmin}
              className="text-gray-600 hover:text-gray-900"
            >
              管理画面へ
            </Button>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">音声アップロード</TabsTrigger>
            <TabsTrigger value="reports">レポート</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <AudioUpload />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportViewer />
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
