'use client';

import { useState, useEffect } from 'react';
import { StickyNote, Plus, Pin, Trash2, Edit2, Check } from 'lucide-react';

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [submitting, setSubmitting] = useState(false);

  const colors = [
    { id: 'yellow', name: 'Amarelo Pássaro', bgLight: 'bg-amber-100/90 border-amber-200 text-amber-900', bgDark: 'dark:bg-amber-950/70 dark:border-amber-700/50 dark:text-amber-100', badge: 'bg-amber-400' },
    { id: 'rose', name: 'Rosa Chiclete', bgLight: 'bg-rose-100/90 border-rose-200 text-rose-900', bgDark: 'dark:bg-rose-950/70 dark:border-rose-700/50 dark:text-rose-100', badge: 'bg-rose-400' },
    { id: 'emerald', name: 'Verde Menta', bgLight: 'bg-emerald-100/90 border-emerald-200 text-emerald-900', bgDark: 'dark:bg-emerald-950/70 dark:border-emerald-700/50 dark:text-emerald-100', badge: 'bg-emerald-400' },
    { id: 'sky', name: 'Azul Céu', bgLight: 'bg-sky-100/90 border-sky-200 text-sky-900', bgDark: 'dark:bg-sky-950/70 dark:border-sky-700/50 dark:text-sky-100', badge: 'bg-sky-400' },
    { id: 'purple', name: 'Roxo Lavanda', bgLight: 'bg-purple-100/90 border-purple-200 text-purple-900', bgDark: 'dark:bg-purple-950/70 dark:border-purple-700/50 dark:text-purple-100', badge: 'bg-purple-400' },
  ];

  async function loadReminders() {
    setLoading(true);
    try {
      const activeBabyId = localStorage.getItem('activeBabyId') || '';
      
      // Ensure baby object is loaded
      const babyRes = await fetch(`/api/bowel-movements?babyId=${activeBabyId}`);
      const babyData = await babyRes.json();
      const currentBaby = babyData.baby;
      setBaby(currentBaby);

      if (currentBaby?.id) {
        const res = await fetch(`/api/reminders?babyId=${currentBaby.id}`);
        const data = await res.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setColor('yellow');
    setShowModal(true);
  }

  function handleOpenEdit(rem: any) {
    setEditingId(rem.id);
    setTitle(rem.title);
    setContent(rem.content || '');
    setColor(rem.color || 'yellow');
    setShowModal(true);
  }

  async function handleSaveReminder(e: React.FormEvent) {
    e.preventDefault();
    
    // Fallback baby ID if state is loading
    const activeBabyId = baby?.id || localStorage.getItem('activeBabyId') || '';
    if (!activeBabyId || !title.trim()) {
      alert('Selecione ou crie um bebê para adicionar um lembrete.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await fetch('/api/reminders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: title.trim(),
            content: content.trim(),
            color,
          }),
        });
      } else {
        await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            babyId: activeBabyId,
            title: title.trim(),
            content: content.trim(),
            color,
          }),
        });
      }

      setShowModal(false);
      setTitle('');
      setContent('');
      setEditingId(null);
      await loadReminders();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover este lembrete do mural?')) return;
    try {
      await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      await loadReminders();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-rose-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando mural de lembretes...</p>
      </div>
    );
  }

  const safeReminders = Array.isArray(reminders) ? reminders : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-100 via-rose-50 to-pink-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-amber-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-white/80 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
            Mural de Post-its
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
            <StickyNote className="text-amber-500" size={24} />
            Mural de Lembretes de {baby?.name || 'Seu Bebê'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Fixe recados importantes, lembretes de fraldas, medicamentos e avisos do dia a dia.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-gradient-to-r from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all shrink-0"
        >
          <Plus size={18} />
          <span>Novo Pin / Post-it</span>
        </button>
      </div>

      {/* Pinboard Grid */}
      <div className="bg-amber-50/40 dark:bg-slate-950/60 border border-amber-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 min-h-[400px]">
        {safeReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
            <Pin size={36} className="text-amber-400 opacity-60 animate-bounce" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Seu mural está vazio!</p>
            <p className="text-xs text-slate-400 max-w-xs">Clique no botão acima para afixar o primeiro lembrete colorido no mural de {baby?.name || 'seu bebê'}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {safeReminders.map((rem) => {
              const colorObj = colors.find((c) => c.id === rem.color) || colors[0];
              return (
                <div
                  key={rem.id}
                  className={`relative p-5 rounded-2xl border shadow-md transition-all hover:scale-105 hover:rotate-1 rotate-[-1deg] flex flex-col justify-between ${colorObj.bgLight} ${colorObj.bgDark}`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-rose-500 drop-shadow-md">
                    <Pin size={22} className="rotate-45 fill-rose-500 text-rose-600" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-extrabold tracking-tight leading-snug">{rem.title}</h3>
                    {rem.content && <p className="text-xs font-medium opacity-90 whitespace-pre-wrap">{rem.content}</p>}
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-semibold opacity-75">
                    <span>{new Date(rem.createdAt).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(rem)}
                        className="p-1 hover:opacity-100 transition-opacity"
                        title="Editar Post-it"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(rem.id)}
                        className="p-1 hover:text-red-600 transition-colors"
                        title="Remover Post-it"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New / Edit Pin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📌 {editingId ? 'Editar Post-it' : `Afixar Lembrete em ${baby?.name || 'Seu Bebê'}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Cor do Post-it</label>
                <div className="flex items-center gap-2 justify-between">
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-9 h-9 rounded-full ${c.badge} border-2 flex items-center justify-center transition-transform active:scale-95 ${
                        color === c.id ? 'border-slate-800 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                      title={c.name}
                    >
                      {color === c.id && <Check size={16} className="text-slate-800 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Título do Lembrete</label>
                <input
                  type="text"
                  placeholder="Ex: Dar remédio da febre às 18h"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Descrição / Detalhes (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: 5ml de Paracetamol prescrito pela Dra. Camila..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 rounded-xl shadow-md"
                >
                  {submitting ? 'Fixando...' : 'Fixar no Mural'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
