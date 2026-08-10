'use client';

import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Baby, Mail, Lock, User, Sparkles, Heart } from 'lucide-react';

import { useAuth } from '@/lib/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginAsDemo } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form States
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // Salvar ou atualizar perfil no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || 'Usuário Google',
          displayName: (user.displayName || 'Usuário').split(' ')[0],
          photoURL: user.photoURL || null,
        },
        { merge: true }
      );

      onClose();
    } catch (err: any) {
      if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes('api-key-not-valid'))) {
        setError('⚠️ Chave do Firebase não configurada na Vercel. Adicione NEXT_PUBLIC_FIREBASE_API_KEY no painel da Vercel ou clique no botão de Modo Visitante abaixo.');
      } else {
        setError(err.message || 'Erro ao entrar com Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin) {
      if (!fullName.trim() || !displayName.trim()) {
        setError('Por favor, preencha seu nome e como quer ser chamado.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem!');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login com E-mail e Senha
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Cadastro de Novo Usuário
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = res.user;

        await updateProfile(user, { displayName: displayName.trim() });

        // Gravar no Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: fullName.trim(),
          displayName: displayName.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      onClose();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso por outra conta.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes('api-key-not-valid'))) {
        setError('⚠️ Chave do Firebase não configurada na Vercel. Adicione as variáveis NEXT_PUBLIC_FIREBASE_* nas configurações da Vercel ou use o Modo Visitante abaixo.');
      } else {
        setError(err.message || 'Erro de autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in">
        {/* Top Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-200 dark:from-indigo-600 dark:to-violet-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg">
            👶
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isLogin ? 'Bem-vindo de volta!' : 'Criar Conta no Baby Tracker'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isLogin ? 'Acesse o painel do seu bebê e compartilhe com seu parceiro(a).' : 'Cadastre-se para acompanhar seu bebê em casal.'}
          </p>
        </div>

        {/* Form Error Banner */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-semibold text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ex: Edward Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Como quer ser chamado(a)</label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ex: Papai Edward ou Ed"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 hover:opacity-90 shadow-md active:scale-98 transition"
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar no Painel' : 'Criar Minha Conta'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">ou</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Entrar com Google & Modo Visitante */}
        <div className="space-y-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com o Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsDemo(displayName.trim() || 'Cuidador');
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-indigo-500/30 bg-rose-50/80 dark:bg-indigo-500/10 hover:bg-rose-100 text-rose-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>✨ Entrar como Visitante (Modo Demonstração)</span>
          </button>
        </div>

        {/* Toggle Login/Signup */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-rose-500 dark:text-indigo-400 font-bold hover:underline"
          >
            {isLogin ? 'Não tem conta? Cadastre-se aqui' : 'Já possui conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
}
