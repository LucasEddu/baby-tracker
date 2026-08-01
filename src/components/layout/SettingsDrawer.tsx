'use client';

import { useState, useEffect } from 'react';
import { Settings, X, User, Baby as BabyIcon, Sun, Moon, Bell, Users, LogOut, LogIn, ChevronRight, Shield, Sparkles, Check, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  babies: any[];
  activeBaby: any;
  onSelectBaby: (id: string) => void;
  onOpenBabyModal: () => void;
  onOpenShareModal: () => void;
  onOpenProfileModal: () => void;
  onOpenAuthModal: () => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  isDarkMode,
  toggleTheme,
  babies,
  activeBaby,
  onSelectBaby,
  onOpenBabyModal,
  onOpenShareModal,
  onOpenProfileModal,
  onOpenAuthModal,
}: SettingsDrawerProps) {
  const { user, profile, logout } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [activeTab, setActiveTab] = useState<'profile' | 'house' | 'theme' | 'notifications'>('profile');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  async function requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('🔔 Notificações Ativadas!', {
          body: 'Você receberá alertas no seu celular quando houver novidades sobre o bebê.',
          icon: '/icon.png',
        });
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-rose-100 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-rose-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-slate-900 dark:to-slate-950">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 text-white flex items-center justify-center shadow-md">
                <Settings size={20} className="animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Painel de Configurações</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Perfil, Casa, Temas e Notificações</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Quick Section Selector Tabs */}
          <div className="grid grid-cols-4 p-2 bg-slate-100/70 dark:bg-slate-950 border-b border-rose-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-indigo-400 shadow-xs font-black'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User size={15} />
              <span>Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('house')}
              className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                activeTab === 'house'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-indigo-400 shadow-xs font-black'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BabyIcon size={15} />
              <span>Minha Casa</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                activeTab === 'theme'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-indigo-400 shadow-xs font-black'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sun size={15} />
              <span>Temas</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 rounded-xl transition flex flex-col items-center gap-1 ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-indigo-400 shadow-xs font-black'
                  : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bell size={15} />
              <span>Notificações</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* TAB 1: PERFIL DE USUÁRIO */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-rose-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-rose-400 dark:bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                      {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '👤')}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                        {user ? (profile?.displayName || 'Usuário Cadastrado') : 'Visitante'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {user ? (user.email || profile?.role || 'Conta Ativa') : 'Nenhum usuário conectado'}
                      </p>
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfileModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 dark:bg-indigo-600 text-white text-xs font-bold transition shadow-xs"
                    >
                      Entrar
                    </button>
                  )}
                </div>

                {user && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfileModal();
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Shield size={16} className="text-rose-500 dark:text-indigo-400" />
                        <span>Editar Dados do Perfil e Senha</span>
                      </div>
                      <ChevronRight size={15} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="w-full p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400"
                    >
                      <div className="flex items-center space-x-2.5">
                        <LogOut size={16} />
                        <span>Sair da Conta (Logout)</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MINHA CASA & BEBÊS */}
            {activeTab === 'house' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500 dark:text-indigo-400">
                    Bebê Ativo no Momento
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBabyModal();
                    }}
                    className="text-xs font-bold text-rose-500 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Cadastrar Outro</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {babies.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBaby(b.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        b.id === activeBaby?.id
                          ? 'bg-rose-50/90 dark:bg-indigo-500/15 border-rose-300 dark:border-indigo-500/50 ring-2 ring-rose-400/30 dark:ring-indigo-500/30'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-xs">
                          👶
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{b.name}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Nascimento: {new Date(b.birthDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {b.id === activeBaby?.id && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-rose-200 dark:border-indigo-500/30">
                          Ativo
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Seção de Sincronização em Casal */}
                <div className="pt-2 border-t border-rose-100 dark:border-slate-800">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-900/40 space-y-2">
                    <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <Users size={16} />
                      <span>Sincronização em Casal 👨‍👩‍👧</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Compartilhe o código deste bebê com seu marido, esposa ou cuidador para ambos acompanharem em tempo real.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShareModal();
                      }}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Gerar / Digitar Código de Casal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TEMAS E APARÊNCIA */}
            {activeTab === 'theme' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500 dark:text-indigo-400">
                  Modo Visual da Interface
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Modo Claro */}
                  <div
                    onClick={() => {
                      if (isDarkMode) toggleTheme();
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col items-center text-center space-y-2 ${
                      !isDarkMode
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
                      <Sun size={20} />
                    </div>
                    <span className="text-xs font-bold">Modo Claro ☀️</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Ideal para uso diurno com alto brilho</p>
                  </div>

                  {/* Modo Escuro */}
                  <div
                    onClick={() => {
                      if (!isDarkMode) toggleTheme();
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col items-center text-center space-y-2 ${
                      isDarkMode
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-100 ring-2 ring-indigo-500 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Moon size={20} />
                    </div>
                    <span className="text-xs font-bold">Modo Escuro 🌙</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Suave para os olhos durante mamadas noturnas</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICAÇÕES */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500 dark:text-indigo-400">
                  Notificações no Celular
                </span>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                        <Bell size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Notificações Push</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Status: <strong className="capitalize">{notificationPermission}</strong>
                        </p>
                      </div>
                    </div>

                    {notificationPermission === 'granted' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                        <Check size={12} />
                        Ativado
                      </span>
                    ) : (
                      <button
                        onClick={requestNotificationPermission}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 text-white text-xs font-bold transition shadow-xs"
                      >
                        Ativar
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Com as notificações ativadas, você recebe avisos no celular quando o bebê chorar, quando lembretes forem criados pelo casal ou no horário das consultas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-rose-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Baby Tracker v1.2 • Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
