'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/lib/authContext';
import { Users, UserPlus, Copy, Check, Heart, ShieldCheck } from 'lucide-react';

interface ShareBabyModalProps {
  isOpen: boolean;
  onClose: () => void;
  baby: any;
}

export default function ShareBabyModal({ isOpen, onClose, baby }: ShareBabyModalProps) {
  const { user, profile } = useAuth();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !baby) return null;

  const handleShareWithPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!partnerEmail.trim()) {
      setErrorMsg('Por favor, digite o e-mail do seu parceiro(a).');
      return;
    }

    setLoading(true);
    try {
      // 1. Vincular parceiro(a) na lista de caretakers do bebê no Firestore
      const babyRef = doc(db, 'babies', baby.id);
      await updateDoc(babyRef, {
        caretakerEmails: arrayUnion(partnerEmail.trim().toLowerCase()),
      });

      setSuccessMsg(`Acesso compartilhado com sucesso para ${partnerEmail.trim()}! Quando ele(a) fizer login, verá o bebê ${baby.name}.`);
      setPartnerEmail('');
    } catch (e: any) {
      console.error('Erro ao compartilhar bebê:', e);
      setErrorMsg(e.message || 'Erro ao compartilhar acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    const code = baby.id;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500 dark:text-indigo-400" />
            Compartilhar {baby.name} em Casal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Adicione o e-mail do seu parceiro(a) para que ambos possam visualizar e registrar amamentações, fraldas e sonecas no mesmo painel em tempo real.
        </p>

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleShareWithPartner} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              E-mail do Parceiro(a)
            </label>
            <input
              type="email"
              placeholder="esposa@exemplo.com ou marido@exemplo.com"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            <span>{loading ? 'Concedendo acesso...' : 'Conceder Acesso ao Casal'}</span>
          </button>
        </form>

        {/* Código de Convite do Bebê */}
        <div className="pt-3 border-t border-rose-100 dark:border-slate-800 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Código do Bebê para Vinculação Rápida
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={baby.id}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
            />
            <button
              onClick={handleCopyInviteCode}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition shrink-0 text-xs font-bold flex items-center gap-1"
            >
              {copiedCode ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
