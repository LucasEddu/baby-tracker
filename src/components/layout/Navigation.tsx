'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Syringe, Stethoscope, StickyNote, Sun, Moon, Baby as BabyIcon, Plus, Trash2, ChevronDown, LogIn, Users, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import HeaderAgendaWidget from './HeaderAgendaWidget';
import AuthModal from '../auth/AuthModal';
import ShareBabyModal from '../auth/ShareBabyModal';
import ProfileSettingsModal from '../auth/ProfileSettingsModal';
import SettingsDrawer from './SettingsDrawer';
import PushNotificationManager from './PushNotificationManager';
import { useAuth } from '@/lib/authContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, profile, logout, loading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Abrir modal de Login automaticamente no primeiro acesso se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    }
  }, [authLoading, user]);

  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [showBabyModal, setShowBabyModal] = useState(false);
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyDate, setNewBabyDate] = useState('');
  const [newBabyGender, setNewBabyGender] = useState('male');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  function toggleTheme() {
    if (isDarkMode) {
      setIsDarkMode(false);
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }

  async function loadBabies() {
    try {
      const res = await fetch('/api/babies');
      const data = await res.json();
      const babyList = Array.isArray(data) ? data : [];
      setBabies(babyList);

      const stored = localStorage.getItem('activeBabyId');
      const activeId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : (babyList[0]?.id || '');
      if (activeId) {
        localStorage.setItem('activeBabyId', activeId);
      }
      setSelectedBabyId(activeId);
    } catch (e) {
      console.error(e);
      setBabies([]);
    }
  }

  useEffect(() => {
    loadBabies();
  }, []);

  function handleSelectBaby(id: string) {
    if (!id || id === 'undefined' || id === 'null') return;
    setSelectedBabyId(id);
    localStorage.setItem('activeBabyId', id);
    window.location.reload();
  }

  async function handleCreateBaby(e: React.FormEvent) {
    e.preventDefault();
    if (!newBabyName || !newBabyDate) {
      alert('Por favor, preencha o nome e a data de nascimento.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBabyName,
          birthDate: newBabyDate,
          gender: newBabyGender,
        }),
      });
      const newBaby = await res.json();
      if (!res.ok || !newBaby || !newBaby.id) {
        throw new Error(newBaby?.error || 'Erro ao cadastrar bebê');
      }

      setShowBabyModal(false);
      setNewBabyName('');
      setNewBabyDate('');
      await loadBabies();
      if (newBaby.id) {
        handleSelectBaby(newBaby.id);
      }
    } catch (e: any) {
      console.error('Erro ao cadastrar bebê:', e);
      alert(e.message || 'Ocorreu um erro ao cadastrar o bebê.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteBaby(id: string, name: string) {
    if (babies.length <= 1) {
      alert('Você precisa ter pelo menos um bebê cadastrado.');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o perfil do bebê "${name}"?`)) return;

    try {
      await fetch(`/api/babies?id=${id}`, { method: 'DELETE' });
      await loadBabies();
      const remaining = babies.filter((b) => b.id !== id);
      if (remaining[0]) handleSelectBaby(remaining[0].id);
    } catch (e) {
      console.error(e);
    }
  }

  const safeBabies = Array.isArray(babies) ? babies : [];
  const activeBaby = safeBabies.find((b) => b.id === selectedBabyId) || safeBabies[0];

  const navItems = [
    { href: '/', label: 'Hoje / Dashboard', icon: Home },
    { href: '/growth', label: 'Crescimento', icon: TrendingUp },
    { href: '/vaccines', label: 'Vacinas', icon: Syringe },
    { href: '/appointments', label: 'Consultas', icon: Stethoscope },
    { href: '/reminders', label: 'Mural de Lembretes', icon: StickyNote },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-rose-100 dark:border-slate-800 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4 w-full shadow-sm transition-colors">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center font-bold text-slate-800 dark:text-white shadow-md text-lg group-hover:scale-105 transition-transform">
              👶
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-rose-500 dark:group-hover:text-indigo-400 transition-colors">
                Baby Tracker
              </h1>
              <p className="text-xs text-rose-400 dark:text-slate-400 font-medium hidden sm:block">Acompanhamento do Bebê</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-rose-50/80 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-rose-100 dark:border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-none dark:bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Central Widget: Relógio e Calendário Agenda */}
        <div className="hidden lg:flex items-center">
          <HeaderAgendaWidget />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botão de Notificações Push Silencioso */}
          <PushNotificationManager />

          {/* Botão para Troca de Bebê Ativo */}
          <button
            onClick={() => setShowBabyModal(true)}
            className="flex items-center gap-2 bg-rose-50 dark:bg-slate-800/60 hover:bg-rose-100/70 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all shadow-xs"
          >
            <BabyIcon size={16} className="text-rose-500 dark:text-indigo-400" />
            <span>{activeBaby?.name || 'Selecione Bebê'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Botão Principal do Menu Lateral de Configurações ⚙️ */}
          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-400 via-pink-500 to-rose-500 dark:from-indigo-600 dark:to-violet-600 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all active:scale-95"
            title="Abrir Menu de Configurações (Perfil, Casa, Temas e Notificações)"
          >
            <Settings size={16} className="animate-spin-slow" />
            <span className="hidden sm:inline">Configurações</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-rose-100 dark:border-slate-800 px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'text-rose-500 dark:text-indigo-400 bg-rose-50 dark:bg-indigo-500/10 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} className={isActive ? 'scale-110 transition-transform' : ''} />
                <span className="text-[9px] mt-1 truncate max-w-[50px] text-center">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <Settings size={18} className="animate-spin-slow text-rose-500 dark:text-indigo-400" />
            <span className="text-[9px] mt-1 text-center font-bold">Config</span>
          </button>
        </div>
      </nav>

      {/* Baby Switcher Modal */}
      {showBabyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                👶 Gerenciar Perfis de Bebês
              </h3>
              <button onClick={() => setShowBabyModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-indigo-400">Selecionar Bebê Ativo</label>
              {babies.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    b.id === activeBaby?.id
                      ? 'bg-rose-50 dark:bg-indigo-500/10 border-rose-300 dark:border-indigo-500/40 text-rose-600 dark:text-indigo-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  onClick={() => handleSelectBaby(b.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>👶</span>
                    <span className="text-xs font-semibold">{b.name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBaby(b.id, b.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                    title="Excluir Perfil de Bebê"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateBaby} className="space-y-3 pt-3 border-t border-rose-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                + Cadastrar Novo Bebê
              </label>

              <div>
                <input
                  type="text"
                  placeholder="Nome do Bebê (Ex: Helena)"
                  value={newBabyName}
                  onChange={(e) => setNewBabyName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Gênero / Tema do Perfil</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'Menino 👦', color: 'border-sky-300 text-sky-600 bg-sky-50 dark:bg-sky-500/10' },
                    { id: 'female', label: 'Menina 👧', color: 'border-rose-300 text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
                    { id: 'other', label: 'Unissex 👶', color: 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setNewBabyGender(g.id)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                        newBabyGender === g.id
                          ? `${g.color} ring-2 ring-offset-1 ring-current shadow-xs font-black`
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={newBabyDate}
                  onChange={(e) => setNewBabyDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBabyModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 rounded-xl shadow-md"
                >
                  {submitting ? 'Cadastrando...' : 'Cadastrar Bebê'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Menu Lateral Unificado de Configurações ⚙️ */}
      <SettingsDrawer
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        babies={safeBabies}
        activeBaby={activeBaby}
        onSelectBaby={handleSelectBaby}
        onOpenBabyModal={() => setShowBabyModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Modais de Autenticação, Perfil e Compartilhamento de Casal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ShareBabyModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} baby={activeBaby} />
      <ProfileSettingsModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
