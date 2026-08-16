'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Syringe, Stethoscope, Sun, Moon, Sparkles, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navItems = [
    { href: '/', label: 'Hoje', icon: Home },
    { href: '/leaps', label: 'Saltos', icon: Sparkles },
    { href: '/appointments', label: 'Saúde', icon: Stethoscope },
    { href: '/knowledge', label: 'Acervo', icon: BookOpen },
  ];


  return (
    <>
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg text-sm">
            👶
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">Baby Tracker</h1>
            <p className="text-[11px] text-slate-400">Acompanhamento Diário</p>
          </div>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-400 transition-all border border-slate-700 active:scale-95"
          title="Alternar Modo Escuro"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} className="text-slate-300" />}
        </button>
      </header>

      {/* Mobile-first Touch Friendly Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 px-2 py-2 max-w-md mx-auto">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} className={isActive ? 'scale-110 transition-transform' : ''} />
                <span className="text-[11px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
