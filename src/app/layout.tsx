import type { Metadata } from 'next';
import '../packages/rich-editor/styles.css';
import './globals.css';
import { SessionProvider } from './providers';
import { Background } from '@/components/Background';

export const metadata: Metadata = {
  title: 'Draftpad — Collaborative Document Editor',
  description: 'Local-first collaborative document editor with offline sync and version history',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Background />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
