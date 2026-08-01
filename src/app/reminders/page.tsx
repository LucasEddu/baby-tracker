'use client';

import { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, Pin, Trash2, Edit2, Check, ZoomIn, ZoomOut, RotateCcw, Move, Palette, LayoutGrid, Bell, MessageCircle } from 'lucide-react';
import ConfirmModal from '@/components/layout/ConfirmModal';

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
  const [remindAt, setRemindAt] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Canvas / Pan Zoom & Drag states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging pin state
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const colors = [
    { id: 'yellow', name: 'Amarelo Pássaro', bgLight: 'bg-amber-100/95 border-amber-300 text-amber-950', bgDark: 'dark:bg-amber-950/80 dark:border-amber-700/60 dark:text-amber-100', badge: 'bg-amber-400' },
    { id: 'rose', name: 'Rosa Chiclete', bgLight: 'bg-rose-100/95 border-rose-300 text-rose-950', bgDark: 'dark:bg-rose-950/80 dark:border-rose-700/60 dark:text-rose-100', badge: 'bg-rose-400' },
    { id: 'emerald', name: 'Verde Menta', bgLight: 'bg-emerald-100/95 border-emerald-300 text-emerald-950', bgDark: 'dark:bg-emerald-950/80 dark:border-emerald-700/60 dark:text-emerald-100', badge: 'bg-emerald-400' },
    { id: 'sky', name: 'Azul Céu', bgLight: 'bg-sky-100/95 border-sky-300 text-sky-950', bgDark: 'dark:bg-sky-950/80 dark:border-sky-700/60 dark:text-sky-100', badge: 'bg-sky-400' },
    { id: 'purple', name: 'Roxo Lavanda', bgLight: 'bg-purple-100/95 border-purple-300 text-purple-950', bgDark: 'dark:bg-purple-950/80 dark:border-purple-700/60 dark:text-purple-100', badge: 'bg-purple-400' },
  ];

  // Função para alinhar automaticamente os pins em grid organizado
  const handleAlignGrid = (customRemindersList?: any[]) => {
    const list = customRemindersList || reminders;
    const newPos: Record<string, { x: number; y: number }> = {};
    list.forEach((rem, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      newPos[rem.id] = { x: 40 + col * 270, y: 40 + row * 220 };
    });
    setPositions(newPos);
  };

  // Função para ordenar os lembretes por cor e alinhar no grid
  const handleSortByColor = () => {
    const colorOrder: Record<string, number> = { yellow: 0, rose: 1, emerald: 2, sky: 3, purple: 4 };
    const sorted = [...reminders].sort((a, b) => {
      const orderA = colorOrder[a.color] ?? 99;
      const orderB = colorOrder[b.color] ?? 99;
      return orderA - orderB;
    });
    setReminders(sorted);
    handleAlignGrid(sorted);
  };

  async function loadReminders() {
    setLoading(true);
    try {
      const activeBabyId = localStorage.getItem('activeBabyId') || '';

      const babyRes = await fetch(`/api/bowel-movements?babyId=${activeBabyId}`);
      const babyData = await babyRes.json();
      const currentBaby = babyData?.baby;
      setBaby(currentBaby);

      let fetchedReminders: any[] = [];

      // 1. Carregar do Firebase Cloud Firestore (Tempo Real)
      try {
        const { db } = await import('@/lib/firebase');
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        
        const q = query(collection(db, 'reminders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        fetchedReminders = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
      } catch (fsErr) {
        console.error('Erro ao ler Firestore:', fsErr);
      }

      // 2. Fallback para a API REST se o Firestore estivesse vazio
      if (fetchedReminders.length === 0) {
        try {
          const res = await fetch(`/api/reminders?babyId=${currentBaby?.id || ''}`);
          const data = await res.json();
          fetchedReminders = Array.isArray(data) ? data : [];
        } catch (apiErr) {}
      }

      setReminders(fetchedReminders);

      // Inicializar posições em grid para novos pins que não tenham posição salva
      const newPos: Record<string, { x: number; y: number }> = {};
      fetchedReminders.forEach((rem, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        newPos[rem.id] = { x: 40 + col * 260, y: 40 + row * 220 };
      });
      setPositions((prev) => ({ ...newPos, ...prev }));
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

  // Controls Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Panning Canvas (Arrastar o fundo da box)
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (draggingPinId) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (draggingPinId) {
      // Movendo um Post-it específico
      const x = (e.clientX - dragOffset.x - pan.x) / zoom;
      const y = (e.clientY - dragOffset.y - pan.y) / zoom;
      setPositions((prev) => ({
        ...prev,
        [draggingPinId]: { x: Math.max(10, x), y: Math.max(10, y) },
      }));
    } else if (isPanning) {
      // Movendo a área do mural (Pan)
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggingPinId(null);
  };

  // Handlers para Touch / Mobile no Canvas e nos Pins
  const handleTouchStartCanvas = (e: React.TouchEvent) => {
    if (draggingPinId) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setStartPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMoveCanvas = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (draggingPinId) {
        const x = (touch.clientX - dragOffset.x - pan.x) / zoom;
        const y = (touch.clientY - dragOffset.y - pan.y) / zoom;
        setPositions((prev) => ({
          ...prev,
          [draggingPinId]: { x: Math.max(10, x), y: Math.max(10, y) },
        }));
      } else if (isPanning) {
        setPan({
          x: touch.clientX - startPan.x,
          y: touch.clientY - startPan.y,
        });
      }
    }
  };

  const handleTouchEndCanvas = () => {
    setIsPanning(false);
    setDraggingPinId(null);
  };

  const handleStartDragPinTouch = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setDraggingPinId(id);
      const pos = positions[id] || { x: 0, y: 0 };
      setDragOffset({
        x: touch.clientX - pos.x * zoom - pan.x,
        y: touch.clientY - pos.y * zoom - pan.y,
      });
    }
  };

  // Iniciar Drag em um Pin específico (Mouse)
  const handleStartDragPin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingPinId(id);
    const pos = positions[id] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX - pos.x * zoom - pan.x,
      y: e.clientY - pos.y * zoom - pan.y,
    });
  };

  function handleOpenCreate() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setColor('yellow');
    setRemindAt('');
    setSendWhatsapp(true);
    setShowModal(true);
  }

  function handleOpenEdit(e: React.MouseEvent, rem: any) {
    e.stopPropagation();
    setEditingId(rem.id);
    setTitle(rem.title);
    setContent(rem.content || '');
    setColor(rem.color || 'yellow');
    setRemindAt(rem.remindAt ? new Date(rem.remindAt).toISOString().slice(0, 16) : '');
    setSendWhatsapp(!!rem.sendWhatsapp);
    setShowModal(true);
  }

  async function handleSaveReminder(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert('Por favor, digite o título do lembrete.');
      return;
    }

    const activeBabyId = baby?.id || localStorage.getItem('activeBabyId') || '';

    setSubmitting(true);
    try {
      // 1. Tenta gravar no Firebase Cloud Firestore (sincronização em tempo real do casal)
      try {
        const { db } = await import('@/lib/firebase');
        const { collection, addDoc, doc, updateDoc } = await import('firebase/firestore');

        if (editingId) {
          const remRef = doc(db, 'reminders', editingId);
          await updateDoc(remRef, {
            title: title.trim(),
            content: content.trim(),
            color,
            remindAt: remindAt || null,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await addDoc(collection(db, 'reminders'), {
            babyId: activeBabyId,
            title: title.trim(),
            content: content.trim(),
            color,
            remindAt: remindAt || null,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (firestoreErr) {
        console.error('Erro Firestore Reminders:', firestoreErr);
      }

      // 2. Tenta sincronizar com API Prisma local se disponível
      if (editingId) {
        await fetch('/api/reminders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: title.trim(),
            content: content.trim(),
            color,
            remindAt,
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
            remindAt,
          }),
        });
      }

      // Notificação nativa silenciosa / Push no celular se permitido
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`📌 Novo Lembrete: ${title.trim()}`, {
            body: content.trim() || 'Lembrete adicionado ao mural do bebê.',
            icon: '/icon.png',
          });
        } catch (err) {}
      }

      setShowModal(false);
      setTitle('');
      setContent('');
      setRemindAt('');
      setEditingId(null);
      await loadReminders();
    } catch (e) {
      console.error(e);
      alert('Erro de rede ao salvar lembrete');
    } finally {
      setSubmitting(false);
    }
  }

  // Custom Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Remover Lembrete do Mural',
      message: 'Tem certeza que deseja remover este post-it do seu mural?',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
          await loadReminders();
        } catch (err) {
          console.error(err);
        }
      },
    });
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
            Mural Interativo de Post-its
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
            <StickyNote className="text-amber-500" size={24} />
            Mural de Lembretes de {baby?.name || 'Seu Bebê'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Arraste os post-its livremente, dê zoom (+ / -) e organize seu quadro como desejar.
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

      {/* DYNAMIC & INTERACTIVE PINBOARD CANVAS BOX */}
      <div className="relative bg-amber-50/30 dark:bg-slate-950/70 border border-amber-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-inner min-h-[550px]">
        {/* Floating Zoom & Canvas Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-slate-800 p-1.5 rounded-2xl shadow-lg backdrop-blur-md">
          {/* Botão Alinhar Grid */}
          <button
            onClick={() => handleAlignGrid()}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
            title="Alinhar Automático em Grid"
          >
            <LayoutGrid size={15} className="text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Alinhar</span>
          </button>

          {/* Botão Ordenar por Cor */}
          <button
            onClick={handleSortByColor}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
            title="Agrupar e Ordenar por Cor"
          >
            <Palette size={15} className="text-rose-500" />
            <span className="hidden sm:inline">Ordenar por Cor</span>
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reduzir Zoom (-)"
          >
            <ZoomOut size={16} />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Resetar Posição e Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Floating Help Badge */}
        <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center space-x-1.5 bg-white/80 dark:bg-slate-900/80 border border-amber-200/50 dark:border-slate-800 px-3 py-1.5 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 font-medium backdrop-blur-md pointer-events-none">
          <Move size={13} className="text-amber-500" />
          <span>Arraste os post-its livremente ou mova o fundo do quadro</span>
        </div>

        {/* Interactive Viewport Canvas Area */}
        <div
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onMouseLeave={handleMouseUpCanvas}
          onTouchStart={handleTouchStartCanvas}
          onTouchMove={handleTouchMoveCanvas}
          onTouchEnd={handleTouchEndCanvas}
          className={`w-full h-[550px] relative select-none cursor-grab active:cursor-grabbing overflow-hidden ${
            isPanning ? 'cursor-grabbing' : ''
          }`}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(217, 119, 6, 0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Pan & Zoom Container */}
          <div
            className="w-full h-full relative transition-transform duration-75 ease-out origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {safeReminders.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 pointer-events-none">
                <Pin size={42} className="text-amber-400 opacity-60 animate-bounce" />
                <p className="text-base font-bold text-slate-600 dark:text-slate-300">Seu mural está pronto!</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Adicione quantos pins quiser clicando em "+ Novo Pin / Post-it".
                </p>
              </div>
            ) : (
              safeReminders.map((rem, idx) => {
                const colorObj = colors.find((c) => c.id === rem.color) || colors[0];
                const pos = positions[rem.id] || { x: 40 + (idx % 3) * 260, y: 40 + Math.floor(idx / 3) * 220 };
                const isDraggingThis = draggingPinId === rem.id;

                return (
                  <div
                    key={rem.id}
                    onMouseDown={(e) => handleStartDragPin(e, rem.id)}
                    onTouchStart={(e) => handleStartDragPinTouch(e, rem.id)}
                    className={`absolute w-60 p-5 rounded-2xl border shadow-xl transition-shadow cursor-move flex flex-col justify-between ${
                      colorObj.bgLight
                    } ${colorObj.bgDark} ${isDraggingThis ? 'z-30 scale-105 shadow-2xl ring-2 ring-indigo-500' : 'z-10 hover:z-20'}`}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                    }}
                  >
                    {/* Pin Visual Indicator */}
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
                          onClick={(e) => handleOpenEdit(e, rem)}
                          className="p-1 hover:opacity-100 transition-opacity"
                          title="Editar Post-it"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, rem.id)}
                          className="p-1 hover:text-red-600 transition-colors"
                          title="Remover Post-it"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New / Edit Pin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📌 {editingId ? 'Editar Post-it' : `Afixar Lembrete em ${baby?.name || 'Seu Bebê'}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
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
                  rows={2}
                  placeholder="Ex: 5ml de Paracetamol prescrito pela Dra. Camila..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium resize-none"
                ></textarea>
              </div>

              {/* Data e Hora Programada para o Alarme */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Bell size={14} className="text-amber-500" />
                  <span>Horário Programado do Alarme / Lembrete</span>
                </label>
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
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
      {/* Custom Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
