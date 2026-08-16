import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import { AuthProvider } from '@/lib/authContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Baby Tracker | Acompanhamento do Bebê em Casal',
  description: 'Aplicativo de acompanhamento diário, saúde, crescimento e vacinação do bebê com sincronização em casal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Baby Tracker',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen pb-16 md:pb-8 selection:bg-rose-400 dark:selection:bg-indigo-500 selection:text-white transition-colors duration-300`}>
        <AuthProvider>
          <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 shadow-2xl relative transition-colors duration-300">
            <Navigation />
            <main className="w-full px-4 sm:px-6 md:px-8 py-6">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
