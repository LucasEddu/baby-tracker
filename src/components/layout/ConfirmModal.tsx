'use client';

import React from 'react';
import { AlertCircle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
            isDanger
              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500'
              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-500'
          }`}
        >
          {isDanger ? <Trash2 size={26} /> : <AlertCircle size={26} />}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition active:scale-95 ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
