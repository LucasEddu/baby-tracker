'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, updateEmail } from 'firebase/auth';
import { User, Mail, Lock, Sparkles, Phone, Shield, Bell, Check, X, Camera, LogOut, Heart } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user, profile, reloadProfile, logout } = useAuth();

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'MÃE' | 'PAI' | 'CUIDADOR' | 'PEDIATRA' | 'OUTRO'>('MÃE');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState('rose');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Security Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatarColors = [
    { id: 'rose', name: 'Rosa Chiclete', bg: 'bg-rose-500', text: 'text-rose-500' },
    { id: 'sky', name: 'Azul Céu', bg: 'bg-sky-500', text: 'text-sky-500' },
    { id: 'amber', name: 'Âmbar Sol', bg: 'bg-amber-500', text: 'text-amber-500' },
    { id: 'emerald', name: 'Verde Menta', bg: 'bg-emerald-500', text: 'text-emerald-500' },
    { id: 'purple', name: 'Roxo Lavanda', bg: 'bg-purple-500', text: 'text-purple-500' },
  ];

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setDisplayName(profile.displayName || '');
      setRole(profile.role || 'MÃE');
      setPhone(profile.phone || '');
      setAvatarColor(profile.avatarColor || 'rose');
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
    }
  }, [profile, isOpen]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !displayName.trim()) {
      setErrorMsg('Por favor, preencha seu nome e como quer ser chamado.');
      return;
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setErrorMsg('As senhas informadas não coincidem.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('A nova senha precisa ter no mínimo 6 caracteres.');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Atualizar Perfil no Firebase Auth
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      // 2. Atualizar Senha se preenchida
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      // 3. Gravar Atualização no Firestore (/users/{uid})
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email,
          fullName: fullName.trim(),
          displayName: displayName.trim(),
          role,
          phone: phone.trim(),
          avatarColor,
          notificationsEnabled,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      await reloadProfile();
      setSuccessMsg('Perfil e configurações atualizados com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMsg('Para alterar a senha, faça login novamente e tente em seguida.');
      } else {
        setErrorMsg(err.message || 'Erro ao salvar alterações no perfil.');
      }
    } finally {
      setSaving(false);
    }
  };

  const currentColorObj = avatarColors.find((c) => c.id === avatarColor) || avatarColors[0];

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl ${currentColorObj.bg} text-white flex items-center justify-center text-xl font-bold shadow-md`}>
              {role === 'MÃE' ? '👩‍👧' : role === 'PAI' ? '👨‍👦' : role === 'CUIDADOR' ? '🧑‍🍼' : '🩺'}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Perfil & Configurações</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl text-center">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Seletor de Papel no Cuidado do Bebê */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Seu Papel na Família / Cuidado
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['MÃE', 'PAI', 'CUIDADOR', 'PEDIATRA', 'OUTRO'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${
                    role === r
                      ? 'bg-rose-100 dark:bg-indigo-500/20 text-rose-600 dark:text-indigo-300 border-rose-300 dark:border-indigo-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {r === 'MÃE' ? '👩 Mãe' : r === 'PAI' ? '👨 Pai' : r === 'CUIDADOR' ? '🧑 Cuidador' : r === 'PEDIATRA' ? '🩺 Pediatra' : '👶 Outro'}
                </button>
              ))}
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Como quer ser chamado(a)</label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefone / WhatsApp (Opcional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Cor de Destaque do Perfil */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Cor do Selo de Perfil</label>
            <div className="flex items-center gap-3">
              {avatarColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAvatarColor(c.id)}
                  className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition active:scale-95 ${
                    avatarColor === c.id ? 'ring-4 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110' : 'opacity-80'
                  }`}
                  title={c.name}
                >
                  {avatarColor === c.id && <Check size={16} className="text-white font-bold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Alteração de Senha */}
          <div className="pt-3 border-t border-rose-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Lock size={14} /> Alterar Senha de Acesso
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Nova Senha (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium"
              />
              <input
                type="password"
                placeholder="Confirmar Nova Senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (confirm('Deseja realmente sair da sua conta?')) {
                  await logout();
                  onClose();
                }
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-red-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
