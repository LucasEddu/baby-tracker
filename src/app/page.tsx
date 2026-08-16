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
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Scale,
  Settings,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { formatAge, translateColor, translateConsistency } from '@/lib/utils';
import Link from 'next/link';
import SmartNapModal from '@/components/nap/SmartNapModal';
import ConfirmModal from '@/components/layout/ConfirmModal';

import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

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

  // Diaper Modal state
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

  async function loadData(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const stored = localStorage.getItem('activeBabyId');
      const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
      const res = await fetch(`/api/bowel-movements${activeBabyId ? `?babyId=${activeBabyId}` : ''}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 3500);

    let unsubscribes: any[] = [];
    const stored = localStorage.getItem('activeBabyId');
    const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';

    if (activeBabyId) {
      try {
        const q1 = query(collection(db, 'bowel_movements'), where('babyId', '==', activeBabyId));
        const q2 = query(collection(db, 'feeding_logs'), where('babyId', '==', activeBabyId));
        const q3 = query(collection(db, 'growth_records'), where('babyId', '==', activeBabyId));

        unsubscribes.push(onSnapshot(q1, () => loadData(false)));
        unsubscribes.push(onSnapshot(q2, () => loadData(false)));
        unsubscribes.push(onSnapshot(q3, () => loadData(false)));
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      unsubscribes.forEach((unsub) => unsub && unsub());
    };
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
      await loadData(false);
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
      await loadData(false);
    } catch (e) {
      console.error(e);
    }
  }

  function formatTimer(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

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
      await loadData(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

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

  async function handleDeleteDiaper(id: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Registro de Fralda',
      message: 'Tem certeza que deseja remover este registro de troca de fralda?',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/bowel-movements?id=${id}`, { method: 'DELETE' });
          await loadData(false);
        } catch (e) {
          console.error(e);
        }
      },
    });
  }

  async function handleDeleteFeeding(id: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Registro de Amamentação',
      message: 'Tem certeza que deseja remover este registro de mamada?',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/feedings?id=${id}`, { method: 'DELETE' });
          await loadData(false);
        } catch (e) {
          console.error(e);
        }
      },
    });
  }

  // Format relative time helper in Portuguese
  function formatRelativeTime(dateString?: string | Date): string {
    if (!dateString) return 'Sem registros';
    const diffMs = Date.now() - new Date(dateString).getTime();
    if (diffMs < 0) return 'Agora';

    const totalMin = Math.floor(diffMs / (1000 * 60));
    if (totalMin < 1) return 'Agora mesmo';
    if (totalMin < 60) return `Há ${totalMin} min`;

    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hours < 24) {
      return mins > 0 ? `Há ${hours}h ${mins}min` : `Há ${hours}h`;
    }

    const days = Math.floor(hours / 24);
    return `Há ${days} dia(s)`;
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
  const growthList = data?.growth || [];
  const feedings = data?.feedings || [];
  const vaccinesList = data?.vaccines || [];
  const appointmentsList = data?.appointments || [];
  const napSessions = data?.napSessions || [];
  const todayDiaperCount = data?.todayDiaperCount || 0;

  // 1. Last Feeding Info & Next Breast Recommendation
  const lastFeeding = feedings[0];
  const lastFeedingTimeText = formatRelativeTime(lastFeeding?.startedAt);
  const lastFeedingSide = lastFeeding?.side;
  const lastBreastFeeding = feedings.find((f: any) => f.side === 'LEFT_BREAST' || f.side === 'RIGHT_BREAST');
  const nextBreastText = !lastBreastFeeding || lastBreastFeeding.side === 'RIGHT_BREAST'
    ? 'Próximo seio: Esquerdo 👈'
    : 'Próximo seio: Direito 👉';

  // 2. Last Diaper Info
  const lastDiaper = bowelList[0];
  const lastDiaperTimeText = formatRelativeTime(lastDiaper?.loggedAt);
  const lastDiaperTypeText = lastDiaper
    ? lastDiaper.type === 'PEE'
      ? '💧 Xixi'
      : lastDiaper.type === 'POOP'
      ? '💩 Cocô'
      : '💧💩 Ambos'
    : 'Sem registros';

  // 3. Sleep Status & Wake Window
  const latestNap = napSessions[0];
  const isSleeping = latestNap && (latestNap.status === 'RUNNING' || !latestNap.endedAt);
  const sleepStatusText = isSleeping ? 'Dormindo 🌙' : 'Acordado ☀️';
  const wakeWindowText = isSleeping
    ? `Soneca em andamento (${formatRelativeTime(latestNap?.startedAt)})`
    : latestNap?.endedAt
    ? `Janela de vigília: ${formatRelativeTime(latestNap.endedAt)}`
    : 'Acordado';

  // 4. Today Summary
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayFeedings = feedings.filter((f: any) => new Date(f.startedAt || 0) >= startOfToday);
  const todayFeedingTotalSec = todayFeedings.reduce((sum: number, f: any) => sum + (f.durationSec || 0), 0);
  const todayFeedingMin = Math.floor(todayFeedingTotalSec / 60);

  // 5. Growth Delta & Latest Weight
  const latestGrowth = growthList[0];
  const previousGrowth = growthList[1];
  let growthKg = '0.000';
  let growthDeltaText: string | null = null;
  let isGrowthUp = true;

  if (latestGrowth) {
    growthKg = (latestGrowth.weightGrams / 1000).toFixed(3);
    if (previousGrowth) {
      const diffGrams = latestGrowth.weightGrams - previousGrowth.weightGrams;
      isGrowthUp = diffGrams >= 0;
      growthDeltaText = `${isGrowthUp ? '▲ +' : '▼ '}${Math.abs(diffGrams)}g`;
    }
  }

  // 6. Next Recommended Vaccine
  let nextVaccineText = 'Carteira em dia';
  if (baby?.birthDate) {
    const bDate = new Date(baby.birthDate);
    const now = new Date();
    const ageMonths = (now.getFullYear() - bDate.getFullYear()) * 12 + (now.getMonth() - bDate.getMonth());
    const pending = vaccinesList.find((v: any) => !v.applied && (v.targetAgeMonths || 0) >= ageMonths);
    if (pending) {
      nextVaccineText = `${pending.name} (${pending.targetAgeMonths === 0 ? 'Nascer' : `${pending.targetAgeMonths}m`})`;
    } else {
      const anyPending = vaccinesList.find((v: any) => !v.applied);
      if (anyPending) nextVaccineText = `${anyPending.name} (${anyPending.targetAgeMonths}m)`;
    }
  }

  // 7. Next Medical Appointment
  const upcomingAppointment = appointmentsList.find((a: any) => new Date(a.appointmentDate) >= new Date()) || appointmentsList[0];

  // Combined timeline build
  const timeline: any[] = [];

  bowelList.forEach((b: any) => {
    timeline.push({
      id: b.id,
      date: new Date(b.loggedAt),
      category: 'bowel',
      title: b.type === 'PEE' ? 'Xixi 💧' : b.type === 'POOP' ? 'Cocô 💩' : 'Xixi e Cocô 💧💩',
      subtitle: b.type !== 'PEE' ? `${translateColor(b.color)} • ${translateConsistency(b.consistency)}` : 'Troca de fralda',
      notes: b.notes,
      colorBadge: b.type === 'PEE'
        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
        : b.color === 'ALERT_BLOOD'
        ? 'bg-red-500/20 text-red-400 border-red-500/40'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
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
      subtitle: `${sideText} • Duração: ${min > 0 ? `${min} min` : `${f.durationSec}s`}`,
      notes: f.notes,
      colorBadge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      raw: f,
    });
  });

  growthList.forEach((g: any) => {
    timeline.push({
      id: g.id,
      date: new Date(g.measuredAt),
      category: 'growth',
      title: `Medição Antropométrica 📏`,
      subtitle: `${(g.weightGrams / 1000).toFixed(3)} kg • ${g.heightCm} cm ${g.headCircCm ? `• PC: ${g.headCircCm} cm` : ''}`,
      notes: `Origem: ${g.source === 'DOCTOR' ? 'Pediatra 🩺' : 'Em Casa 🏠'}`,
      colorBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      raw: g,
    });
  });

  napSessions.forEach((n: any) => {
    const reasonText = n.endReason === 'cry_detected' ? 'Encerrado por Choro 😭' : 'Finalizado Manualmente ☀️';
    timeline.push({
      id: n.id,
      date: new Date(n.startedAt),
      category: 'nap',
      title: 'Soneca Inteligente 🌙',
      subtitle: `Duração: ${n.durationMinutes || 0} min • ${reasonText}`,
      notes: n.whiteNoiseUsed ? `Ruído branco: ${n.whiteNoiseUsed}` : undefined,
      colorBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      raw: n,
    });
  });

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Constipation Alert check (> 36h since last poop)
  const lastPoop = bowelList.find((b: any) => b.type === 'POOP' || b.type === 'BOTH');
  const hoursSincePoop = lastPoop
    ? (Date.now() - new Date(lastPoop.loggedAt).getTime()) / (1000 * 60 * 60)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Smart Nap Fullscreen Modal */}
      <SmartNapModal
        isOpen={isNapModalOpen}
        onClose={() => {
          setIsNapModalOpen(false);
          loadData(false);
        }}
        babyId={baby?.id}
      />

      {/* ==================== 1. HEADER & TOP BAR ==================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            👶
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {baby?.name || 'Seu Bebê'}
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
              <Calendar size={13} className="text-rose-400" />
              <span>{baby?.birthDate ? formatAge(baby.birthDate) : 'Idade não informada'}</span>
            </p>
          </div>
        </div>

        {/* Top Right Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNapModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Moon size={16} className="fill-white" />
            <span>🌙 Iniciar Soneca</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. VISÃO RÁPIDA / STATUS EM TEMPO REAL (GRID 4 CARDS) ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Última Mamada */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-4 sm:p-5 shadow-lg space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
              <Milk size={13} /> Última Mamada
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{lastFeedingTimeText}</h3>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
              {lastFeedingSide === 'LEFT_BREAST'
                ? 'Peito Esquerdo'
                : lastFeedingSide === 'RIGHT_BREAST'
                ? 'Peito Direito'
                : lastFeedingSide === 'BOTTLE'
                ? `Mamadeira (${lastFeeding?.amountMl || 0}ml)`
                : 'Nenhum registro'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="inline-block text-[10px] font-bold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              {nextBreastText}
            </span>
          </div>
        </div>

        {/* Card 2: Última Fralda */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-lg space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
              <Droplet size={13} /> Última Fralda
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{lastDiaperTimeText}</h3>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{lastDiaperTypeText}</p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="inline-block text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {todayDiaperCount} fralda(s) hoje
            </span>
          </div>
        </div>

        {/* Card 3: Status do Sono */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-lg space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
              <Moon size={13} /> Status do Sono
            </span>
            <span className={`w-2 h-2 rounded-full ${isSleeping ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{sleepStatusText}</h3>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{wakeWindowText}</p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="inline-block text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              {napSessions.length} soneca(s) salvas
            </span>
          </div>
        </div>

        {/* Card 4: Resumo do Dia */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-lg space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
              <Sparkles size={13} /> Resumo do Dia
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {todayFeedingMin > 0 ? `${todayFeedingMin} min` : '0 min'}
            </h3>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">Tempo total de mamada hoje</p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="inline-block text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {todayDiaperCount} troca(s) de fralda
            </span>
          </div>
        </div>
      </div>

      {/* Constipation Warning Banner (>36h without poop) */}
      {hoursSincePoop > 36 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-300">
          <AlertTriangle size={22} className="text-amber-400 shrink-0" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-amber-400">Alerta de Evacuação</h4>
            <p className="mt-0.5 font-medium">
              Faz mais de {Math.floor(hoursSincePoop)} horas desde o último registro de evacuação (cocô).
            </p>
          </div>
        </div>
      )}

      {/* ==================== 3. SEÇÃO PRINCIPAL (LAYOUT 2 COLUNAS) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ==================== COLUNA DA ESQUERDA (AÇÕES DO DIA A DIA) ==================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cronômetro de Amamentação */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Heart size={18} className="text-rose-400 fill-rose-400/20" />
                Cronômetro de Amamentação
              </h3>
              {activeFeeding && (
                <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 animate-pulse">
                  Em andamento ⏱️
                </span>
              )}
            </div>

            {/* If Timer Running */}
            {activeFeeding ? (
              <div className="bg-slate-950 border-2 border-rose-500 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                    {activeFeeding.side === 'BOTTLE' ? '🍼' : '🤱'}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      {activeFeeding.side === 'LEFT_BREAST'
                        ? 'Peito Esquerdo'
                        : activeFeeding.side === 'RIGHT_BREAST'
                        ? 'Peito Direito'
                        : 'Mamadeira'}
                    </span>
                    <h4 className="text-3xl font-black text-white font-mono mt-0.5">
                      {formatTimer(activeFeeding.elapsedSec)}
                    </h4>
                  </div>
                </div>

                {activeFeeding.side === 'BOTTLE' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-300">Quantidade (ml):</label>
                    <input
                      type="number"
                      value={bottleMl}
                      onChange={(e) => setBottleMl(e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                )}

                <button
                  onClick={stopAndSaveFeeding}
                  className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-2xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Square size={16} fill="white" />
                  <span>Finalizar & Salvar</span>
                </button>
              </div>
            ) : (
              /* 3 Cards Lado a Lado para Iniciar */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => startFeeding('LEFT_BREAST')}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/80 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Amamentar</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">Peito Esquerdo 🤱</h4>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
                    <Play size={16} fill="white" className="ml-0.5" />
                  </div>
                </button>

                <button
                  onClick={() => startFeeding('RIGHT_BREAST')}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/80 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 block">Amamentar</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">Peito Direito 🤱</h4>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
                    <Play size={16} fill="white" className="ml-0.5" />
                  </div>
                </button>

                <button
                  onClick={() => startFeeding('BOTTLE')}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/80 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Alimentação</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">Mamadeira 🍼</h4>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
                    <Play size={16} fill="white" className="ml-0.5" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Registro Rápido de Fralda */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                💩 Registro Rápido de Fralda (1-Toque)
              </h3>
              <button
                onClick={handleOpenCreate}
                className="text-xs font-bold text-indigo-400 hover:underline"
              >
                + Detalhes Avançados
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickDiaperLog('PEE')}
                className="py-3.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>💧 Xixi</span>
              </button>
              <button
                onClick={() => handleQuickDiaperLog('POOP')}
                className="py-3.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>💩 Cocô</span>
              </button>
              <button
                onClick={() => handleQuickDiaperLog('BOTH')}
                className="py-3.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>💧💩 Ambos</span>
              </button>
            </div>
          </div>

          {/* Linha do Tempo Visual */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-indigo-400" />
                Linha do Tempo de Hoje
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                {timeline.length} eventos
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum evento registrado ainda hoje.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {timeline.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start relative pl-9">
                    <div className="absolute left-2.5 top-3.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                    <div className="flex-1 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${item.colorBadge}`}>
                          {item.title}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {item.category === 'bowel' && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleOpenEdit(item.raw)}
                                className="p-1 text-slate-400 hover:text-indigo-400 rounded-md transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteDiaper(item.id)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          {item.category === 'feeding' && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleDeleteFeeding(item.id)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-200 mt-2">{item.subtitle}</p>
                      {item.notes && <p className="text-xs text-slate-400 mt-1 italic">"{item.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ==================== COLUNA DA DIREITA (PAINÉIS DE SAÚDE & ACOMPANHAMENTO) ==================== */}
        <div className="space-y-6">
          {/* Card Crescimento */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Scale size={16} /> Crescimento & Peso
              </h4>
              <Link href="/growth" className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-0.5">
                Gráficos OMS <ChevronRight size={14} />
              </Link>
            </div>

            {latestGrowth ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Último Peso:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white font-mono">{growthKg} kg</span>
                    {growthDeltaText && (
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                        isGrowthUp
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {growthDeltaText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-medium">Estatura:</span>
                  <span className="font-bold text-emerald-300">{latestGrowth.heightCm} cm</span>
                </div>
                {latestGrowth.headCircCm && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400 font-medium">Perímetro Cefálico:</span>
                    <span className="font-bold text-emerald-300">{latestGrowth.headCircCm} cm</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs font-medium">
                Nenhuma medição registrada ainda.
              </div>
            )}
          </div>

          {/* Card Vacinas */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <ShieldCheck size={16} /> Próxima Vacina
              </h4>
              <Link href="/vaccines" className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-0.5">
                Carteira <ChevronRight size={14} />
              </Link>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Recomendação por Idade</span>
              <p className="text-sm font-extrabold text-white">{nextVaccineText}</p>
              <p className="text-xs text-slate-400 font-medium pt-1 border-t border-slate-800">
                Mantenha a vacinação em dia de acordo com o calendário do Ministério da Saúde.
              </p>
            </div>
          </div>

          {/* Card Consultas */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Stethoscope size={16} /> Agenda de Consultas
              </h4>
              <Link href="/appointments" className="text-xs text-rose-400 hover:underline font-bold flex items-center gap-0.5">
                Calendário <ChevronRight size={14} />
              </Link>
            </div>

            {upcomingAppointment ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    upcomingAppointment.type === 'EMERGENCY'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {upcomingAppointment.type === 'EMERGENCY' ? 'Emergência' : 'Rotina'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(upcomingAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-white">{upcomingAppointment.doctorName}</h5>
                <p className="text-xs text-slate-400 font-medium">{upcomingAppointment.specialty || 'Pediatra'}</p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs font-medium">
                Nenhuma consulta agendada no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Create or Edit Diaper Record */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                💩 {editingId ? 'Editar Registro de Troca' : 'Novo Registro de Eliminação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveDiaper} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Tipo de Eliminação</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'POOP', label: 'Cocô 💩' },
                    { id: 'PEE', label: 'Xixi 💧' },
                    { id: 'BOTH', label: 'Ambos 💧💩' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDiaperType(t.id as any)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        diaperType === t.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
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
                    <label className="text-xs font-bold text-slate-300 block mb-2">Cor das Fezes</label>
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
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Consistência</label>
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
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
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
                <label className="text-xs font-bold text-slate-300 block mb-1">Anotações / Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Trocado após mamada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-400 bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl shadow-md"
                >
                  {submitting ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
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
