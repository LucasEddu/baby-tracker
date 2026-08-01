'use client';

import { useState, useEffect } from 'react';
import {
  Droplet,
  Plus,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronRight,
  Edit2,
  Trash2,
  Play,
  Square,
  Baby,
  Sparkles,
  Milk,
  Heart,
  CheckCircle2,
  Moon,
} from 'lucide-react';
import { formatAge, translateColor, translateConsistency } from '@/lib/utils';
import Link from 'next/link';
import SmartNapModal from '@/components/nap/SmartNapModal';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNapModalOpen, setIsNapModalOpen] = useState(false);

  // Breastfeeding / Feeding Timer State
  const [activeFeeding, setActiveFeeding] = useState<{
    side: 'LEFT_BREAST' | 'RIGHT_BREAST' | 'BOTTLE';
    startTime: number;
    elapsedSec: number;
  } | null>(null);
  const [bottleMl, setBottleMl] = useState('120');

  // Diaper Modal state (For manual/detailed edits if needed)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [diaperType, setDiaperType] = useState<'POOP' | 'PEE' | 'BOTH'>('POOP');
  const [color, setColor] = useState('YELLOW');
  const [consistency, setConsistency] = useState('PASTY');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (activeFeeding) {
      interval = setInterval(() => {
        setActiveFeeding((prev) =>
          prev
            ? { ...prev, elapsedSec: Math.floor((Date.now() - prev.startTime) / 1000) }
            : null
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeFeeding]);

  async function loadData() {
    setLoading(true);
    try {
      const activeBabyId = localStorage.getItem('activeBabyId') || '';
      const res = await fetch(`/api/bowel-movements?babyId=${activeBabyId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Quick 1-Click Diaper Event logger
  async function handleQuickDiaperLog(type: 'PEE' | 'POOP' | 'BOTH') {
    if (!data?.baby?.id) return;
    try {
      await fetch('/api/bowel-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId: data.baby.id,
          type,
          color: type !== 'PEE' ? 'YELLOW' : null,
          consistency: type !== 'PEE' ? 'PASTY' : null,
          notes: 'Registro rápido de 1-toque',
        }),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  // Feeding Timer Controls
  function startFeeding(side: 'LEFT_BREAST' | 'RIGHT_BREAST' | 'BOTTLE') {
    setActiveFeeding({
      side,
      startTime: Date.now(),
      elapsedSec: 0,
    });
  }

  async function stopAndSaveFeeding() {
    if (!activeFeeding || !data?.baby?.id) return;

    try {
      await fetch('/api/feedings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId: data.baby.id,
          side: activeFeeding.side,
          durationSec: activeFeeding.elapsedSec,
          amountMl: activeFeeding.side === 'BOTTLE' ? parseInt(bottleMl, 10) : null,
          notes:
            activeFeeding.side === 'BOTTLE'
              ? `Mamadeira de ${bottleMl}ml`
              : `Mamada no peito ${activeFeeding.side === 'LEFT_BREAST' ? 'esquerdo' : 'direito'}`,
        }),
      });

      setActiveFeeding(null);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  function formatTimer(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Detailed Modal Handlers
  function handleOpenCreate() {
    setEditingId(null);
    setDiaperType('POOP');
    setColor('YELLOW');
    setConsistency('PASTY');
    setNotes('');
    setShowModal(true);
  }

  function handleOpenEdit(b: any) {
    setEditingId(b.id);
    setDiaperType(b.type);
    setColor(b.color || 'YELLOW');
    setConsistency(b.consistency || 'PASTY');
    setNotes(b.notes || '');
    setShowModal(true);
  }

  async function handleSaveDiaper(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.baby?.id) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await fetch('/api/bowel-movements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            type: diaperType,
            color: diaperType !== 'PEE' ? color : null,
            consistency: diaperType !== 'PEE' ? consistency : null,
            notes,
          }),
        });
      } else {
        await fetch('/api/bowel-movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            babyId: data.baby.id,
            type: diaperType,
            color: diaperType !== 'PEE' ? color : null,
            consistency: diaperType !== 'PEE' ? consistency : null,
            notes,
          }),
        });
      }

      setShowModal(false);
      setEditingId(null);
      setNotes('');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDiaper(id: string) {
    if (!confirm('Deseja realmente excluir este registro de troca?')) return;
    try {
      await fetch(`/api/bowel-movements?id=${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteFeeding(id: string) {
    if (!confirm('Deseja remover este registro de amamentação?')) return;
    try {
      await fetch(`/api/feedings?id=${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-rose-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando painel do bebê...</p>
      </div>
    );
  }

  const baby = data?.baby;
  const bowelList = data?.bowel || [];
  const latestGrowth = data?.growth?.[0];
  const feedings = data?.feedings || [];
  const todayDiaperCount = data?.todayDiaperCount || 0;

  // Combined timeline build
  const timeline: any[] = [];

  bowelList.forEach((b: any) => {
    timeline.push({
      id: b.id,
      date: new Date(b.loggedAt),
      category: 'bowel',
      title: b.type === 'PEE' ? 'Xixi 💦' : b.type === 'POOP' ? 'Cocô 💩' : 'Xixi e Cocô 💩💦',
      subtitle: b.type !== 'PEE' ? `${translateColor(b.color)} • ${translateConsistency(b.consistency)}` : 'Troca de fralda',
      notes: b.notes,
      colorBadge: b.color === 'ALERT_BLOOD' ? 'bg-red-500/20 text-red-500 border-red-300' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      raw: b,
    });
  });

  feedings.forEach((f: any) => {
    const sideText =
      f.side === 'LEFT_BREAST'
        ? 'Peito Esquerdo 🤱'
        : f.side === 'RIGHT_BREAST'
        ? 'Peito Direito 🤱'
        : `Mamadeira 🍼 (${f.amountMl || 0}ml)`;

    const min = Math.floor((f.durationSec || 0) / 60);

    timeline.push({
      id: f.id,
      date: new Date(f.startedAt),
      category: 'feeding',
      title: 'Amamentação / Mamada 🍼',
      subtitle: `${sideText} • Duração: ${min > 0 ? `${min} min` : `${f.durationSec} sec`}`,
      notes: f.notes,
      colorBadge: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      raw: f,
    });
  });

  (data?.growth || []).forEach((g: any) => {
    timeline.push({
      id: g.id,
      date: new Date(g.measuredAt),
      category: 'growth',
      title: `Medição Antropométrica 📏`,
      subtitle: `${g.weightGrams}g • ${g.heightCm}cm ${g.headCircCm ? `• PC: ${g.headCircCm}cm` : ''}`,
      notes: `Origem: ${g.source === 'DOCTOR' ? 'Pediatra 🩺' : 'Em Casa 🏠'}`,
      colorBadge: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      raw: g,
    });
  });

  (data?.napSessions || []).forEach((n: any) => {
    const reasonText = n.endReason === 'cry_detected' ? 'Encerrado por Choro 😭' : 'Finalizado Manualmente ☀️';
    timeline.push({
      id: n.id,
      date: new Date(n.startedAt),
      category: 'nap',
      title: 'Soneca Inteligente 🌙',
      subtitle: `Duração: ${n.durationMinutes || 0} min • ${reasonText}`,
      notes: n.whiteNoiseUsed ? `Ruído branco: ${n.whiteNoiseUsed}` : undefined,
      colorBadge: n.endReason === 'cry_detected'
        ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/40'
        : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
      raw: n,
    });
  });

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Constipation Alert check
  const lastPoop = bowelList.find((b: any) => b.type === 'POOP' || b.type === 'BOTH');
  const hoursSincePoop = lastPoop
    ? (Date.now() - new Date(lastPoop.loggedAt).getTime()) / (1000 * 60 * 60)
    : 0;

  const isBoy = baby?.gender === 'male';
  const isGirl = baby?.gender === 'female';

  const genderTheme = isBoy
    ? {
        banner: 'from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-sky-950 dark:to-slate-900 border-sky-200/80 dark:border-sky-800',
        badge: 'text-sky-600 dark:text-sky-300 bg-white/80 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
        avatarBg: 'bg-gradient-to-tr from-sky-400 to-blue-500',
        accentText: 'text-sky-500 dark:text-sky-300',
      }
    : isGirl
    ? {
        banner: 'from-rose-100 via-pink-50 to-purple-100 dark:from-slate-900 dark:via-rose-950 dark:to-slate-900 border-rose-200/80 dark:border-rose-800',
        badge: 'text-rose-600 dark:text-rose-300 bg-white/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
        avatarBg: 'bg-gradient-to-tr from-pink-400 to-rose-500',
        accentText: 'text-rose-500 dark:text-rose-300',
      }
    : {
        banner: 'from-amber-100 via-yellow-50 to-orange-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border-amber-200/80 dark:border-slate-800',
        badge: 'text-amber-700 dark:text-amber-300 bg-white/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
        avatarBg: 'bg-gradient-to-tr from-amber-400 to-orange-500',
        accentText: 'text-amber-600 dark:text-indigo-300',
      };

  return (
    <div className="space-y-6">
      {/* Smart Nap Fullscreen Modal */}
      <SmartNapModal
        isOpen={isNapModalOpen}
        onClose={() => {
          setIsNapModalOpen(false);
          loadData();
        }}
        babyId={baby?.id}
      />
      {/* Top Banner */}
      <div className={`bg-gradient-to-r ${genderTheme.banner} border rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl relative overflow-hidden transition-all duration-300`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border shadow-xs ${genderTheme.badge}`}>
              Painel do Bebê {isBoy ? '👦' : isGirl ? '👧' : '👶'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-2 flex items-center gap-2">
              {baby?.name || 'Seu Bebê'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2 font-medium">
              <Calendar size={15} className={genderTheme.accentText} />
              Idade: <strong className="text-slate-900 dark:text-white">{baby?.birthDate && formatAge(baby.birthDate)}</strong>
            </p>
          </div>

          {/* Top Quick Stats: Diaper Counter & Antropometry & Smart Nap */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Smart Nap Button */}
            <button
              onClick={() => setIsNapModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 px-5 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center gap-2"
            >
              <Moon size={16} className="fill-white" />
              <span>🌙 Iniciar Soneca</span>
            </button>

            {/* Diaper Counter */}
            <div className="bg-white/90 dark:bg-slate-950/60 border border-amber-200 dark:border-amber-500/30 p-3.5 rounded-2xl min-w-[120px] text-center shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">Fraldas Hoje</span>
              <p className="text-xl font-black text-amber-700 dark:text-amber-300">{todayDiaperCount} fralda(s)</p>
            </div>

            {latestGrowth && (
              <>
                <div className="bg-white/90 dark:bg-slate-950/60 border border-rose-100 dark:border-slate-800 p-3.5 rounded-2xl min-w-[110px] text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peso Atual</span>
                  <p className="text-lg font-black text-rose-500 dark:text-indigo-300">{(latestGrowth.weightGrams / 1000).toFixed(2)} kg</p>
                </div>
                <div className="bg-white/90 dark:bg-slate-950/60 border border-rose-100 dark:border-slate-800 p-3.5 rounded-2xl min-w-[110px] text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estatura</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-300">{latestGrowth.heightCm} cm</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BREASTFEEDING / FEEDING TIMER SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Heart size={20} className="text-rose-500 fill-rose-400" />
            Cronômetro de Amamentação & Alimentação
          </h3>
          {activeFeeding && (
            <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full animate-pulse border border-rose-200">
              Amamentação em Andamento ⏱️
            </span>
          )}
        </div>

        {/* Active Feeding Timer Display */}
        {activeFeeding ? (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-slate-950 dark:to-slate-900 border-2 border-rose-400 dark:border-indigo-500 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {activeFeeding.side === 'BOTTLE' ? '🍼' : '🤱'}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-indigo-400">
                  {activeFeeding.side === 'LEFT_BREAST'
                    ? 'Peito Esquerdo'
                    : activeFeeding.side === 'RIGHT_BREAST'
                    ? 'Peito Direito'
                    : 'Mamadeira'}
                </span>
                <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                  {formatTimer(activeFeeding.elapsedSec)}
                </h4>
              </div>
            </div>

            {activeFeeding.side === 'BOTTLE' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantidade (ml):</label>
                <input
                  type="number"
                  value={bottleMl}
                  onChange={(e) => setBottleMl(e.target.value)}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-slate-800 dark:text-white"
                />
              </div>
            )}

            <button
              onClick={stopAndSaveFeeding}
              className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Square size={16} fill="white" />
              <span>Finalizar & Salvar Mamada</span>
            </button>
          </div>
        ) : (
          /* Start Feeding Buttons */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => startFeeding('LEFT_BREAST')}
              className="p-4 bg-rose-50 hover:bg-rose-100/80 dark:bg-slate-950/70 dark:hover:bg-slate-800 border border-rose-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Amamentar</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">Peito Esquerdo 🤱</h4>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={16} fill="white" />
              </div>
            </button>

            <button
              onClick={() => startFeeding('RIGHT_BREAST')}
              className="p-4 bg-pink-50 hover:bg-pink-100/80 dark:bg-slate-950/70 dark:hover:bg-slate-800 border border-pink-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Amamentar</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">Peito Direito 🤱</h4>
              </div>
              <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={16} fill="white" />
              </div>
            </button>

            <button
              onClick={() => startFeeding('BOTTLE')}
              className="p-4 bg-amber-50 hover:bg-amber-100/80 dark:bg-slate-950/70 dark:hover:bg-slate-800 border border-amber-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Alimentação</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">Mamadeira 🍼</h4>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={16} fill="white" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* QUICK 1-CLICK DIAPER ACTIONS */}
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            💩 Registro Rápido de Fralda (1-Clique)
          </h3>
          <button
            onClick={handleOpenCreate}
            className="text-xs font-bold text-rose-500 dark:text-indigo-400 hover:underline"
          >
            + Detalhes Avançados
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleQuickDiaperLog('PEE')}
            className="py-3 px-4 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>💦 Xixi</span>
          </button>
          <button
            onClick={() => handleQuickDiaperLog('POOP')}
            className="py-3 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>💩 Cocô</span>
          </button>
          <button
            onClick={() => handleQuickDiaperLog('BOTH')}
            className="py-3 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>💩💦 Ambos</span>
          </button>
        </div>
      </div>

      {/* Constipation Warning */}
      {hoursSincePoop > 36 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 text-amber-800 dark:text-amber-300">
          <AlertTriangle size={24} className="text-amber-500 shrink-0" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold uppercase tracking-wider">Alerta de Frequência</h4>
            <p className="mt-0.5 font-medium">
              Faz mais de {Math.floor(hoursSincePoop)}h desde o último registro de evacuação de fezes.
            </p>
          </div>
        </div>
      )}

      {/* Desktop Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline & Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock size={18} className="text-rose-400 dark:text-indigo-400" />
                Linha do Tempo Consolidada
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-rose-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                {timeline.length} eventos registrados
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Nenhum evento registrado ainda neste perfil.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-rose-100 dark:before:bg-slate-800">
                {timeline.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start relative pl-9">
                    <div className="absolute left-2.5 top-3.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-400 dark:bg-indigo-500 ring-4 ring-white dark:ring-slate-950"></div>
                    <div className="flex-1 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700 rounded-2xl p-4 transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${item.colorBadge}`}>
                          {item.title}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {item.date.toLocaleDateString('pt-BR')} às{' '}
                            {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {item.category === 'bowel' && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleOpenEdit(item.raw)}
                                className="p-1 text-slate-400 hover:text-indigo-500 rounded-md transition-colors"
                                title="Editar Registro"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteDiaper(item.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                title="Excluir Registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}

                          {item.category === 'feeding' && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleDeleteFeeding(item.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                title="Excluir Mamada"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">{item.subtitle}</p>
                      {item.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{item.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Module Quick Cards */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                📏 Crescimento
              </h4>
              <Link href="/growth" className="text-xs text-rose-500 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                Ver Gráficos <ChevronRight size={14} />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Curvas e histórico antropométrico.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                💉 Vacinas
              </h4>
              <Link href="/vaccines" className="text-xs text-rose-500 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                Carteira <ChevronRight size={14} />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carteira de vacinação infantil por idade.</p>
          </div>
        </div>
      </div>

      {/* Modal for Create or Edit Diaper Record */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                💩 {editingId ? 'Editar Registro de Troca' : 'Novo Registro de Eliminação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveDiaper} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Tipo de Eliminação</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'POOP', label: 'Cocô 💩' },
                    { id: 'PEE', label: 'Xixi 💦' },
                    { id: 'BOTH', label: 'Ambos 💩💦' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDiaperType(t.id as any)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        diaperType === t.id
                          ? 'bg-rose-100 dark:bg-amber-500/20 text-rose-600 dark:text-amber-300 border-rose-300 dark:border-amber-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {diaperType !== 'PEE' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Cor das Fezes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'YELLOW', label: 'Amarelo 🟡' },
                        { id: 'GREEN', label: 'Verde 🟢' },
                        { id: 'BROWN', label: 'Castanho 🟤' },
                        { id: 'MECONIUM', label: 'Meconial 🖤' },
                        { id: 'ALERT_BLOOD', label: 'Alerta/Sangue 🚨' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColor(c.id)}
                          className={`py-2 px-3 text-xs text-left font-semibold rounded-xl border transition-all ${
                            color === c.id
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Consistência</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'PASTY', label: 'Pastoso' },
                        { id: 'LIQUID', label: 'Líquido' },
                        { id: 'HARDENED', label: 'Endurecido' },
                        { id: 'MECONIUM', label: 'Mecônio' },
                      ].map((cs) => (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => setConsistency(cs.id)}
                          className={`py-2 px-3 text-xs text-center font-semibold rounded-xl border transition-all ${
                            consistency === cs.id
                              ? 'bg-rose-100 dark:bg-indigo-500/20 text-rose-600 dark:text-indigo-300 border-rose-300 dark:border-indigo-500/40'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {cs.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Anotações / Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Trocado após mamada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {submitting ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
