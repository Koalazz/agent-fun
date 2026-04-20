import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'agent-fun // session control',
  description: 'Multi-host Claude Code session manager',
  manifest: (process.env.BASE_PATH || '') + '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#081420',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-hidden">{children}</body>
    </html>
  );
}
