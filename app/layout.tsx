# プロジェクトの app ディレクトリへ移動してファイルを作成
cat > app/layout.tsx <<'EOF'
import './globals.css';

export const metadata = {
  title: 'Voice Analysis App',
  description: 'AI-powered voice analysis dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
EOF
