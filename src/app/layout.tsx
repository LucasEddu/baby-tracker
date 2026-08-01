import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import { AuthProvider } from '@/lib/authContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Baby Tracker | Acompanhamento do Bebê em Casal',
  description: 'Aplicativo de acompanhamento diário, saúde, crescimento e vacinação do bebê com sincronização em casal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
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
