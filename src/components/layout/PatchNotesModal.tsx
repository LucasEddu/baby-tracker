'use client';

import React from 'react';
import { Sparkles, ShieldCheck, X, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PatchNotesModal({ isOpen, onClose }: PatchNotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 dark:text-indigo-400 bg-rose-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-rose-200 dark:border-indigo-500/20">
              Histórico de Atualizações
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={24} />
              Patch Notes — Versão 2.4.0
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg text-lg"
          >
            ✕
          </button>
        </div>

        {/* Latest Release Highlight Box */}
        <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 border border-rose-200 dark:border-indigo-800/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>🚀 O que há de novo na v2.4.0 (16/08/2026)</span>
            </h4>
            <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
              Recente
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>🧠 Acervo Pediátrico Baseado em Evidências:</strong> Artigos e guias validados pelas diretrizes da OMS, SBP e AAP (amamentação, sono seguro, primeiros socorros, febre e BLW).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>🚀 Saltos de Desenvolvimento (Wonder Weeks):</strong> Cálculo semanal da idade do bebê, indicador da Fase da Tempestade 🌩️ vs Fase do Sol ☀️ e marcos de crescimento.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>⏸️ Pausa em Amamentação e Soneca:</strong> Opção de congelar cronômetro durante a mamada (para troca de fralda ou troca de peito) e pausar o ruído branco na soneca.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>🍼 Registros Manuais:</strong> Adicione amamentações e sonecas passadas manualmente sem dependência exclusiva de cronômetro ao vivo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>🩺 Acompanhamento Médico Expandido:</strong> Suporte completo para agendar e registrar Consultas Médicas 🩺, Exames Clínicos 🧪 e Testes Neonatais 🔬.</span>
            </li>
          </ul>
        </div>

        {/* Previous Releases History */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            📜 Versões Anteriores
          </h4>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>v2.3.0 — Sincronização Firestore & Redesign da Dashboard</span>
                <span className="text-[10px] text-slate-400 font-normal">10/08/2026</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Sync automático em tempo real no banco de dados e nova interface da página inicial com resumo de fraldas, alertas e mamadas.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>v2.2.0 — Modo Soneca Smart & Ruído Branco</span>
                <span className="text-[10px] text-slate-400 font-normal">04/08/2026</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Detector de choro do bebê via microfone, player áudio synth e modo penumbra para tela ligada sem incômodo.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 rounded-2xl shadow-md hover:opacity-95 transition"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
