'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, Plus, Calendar, CheckSquare, Square, Trash2, Edit2, ChevronLeft, ChevronRight, LayoutGrid, List, Clock, AlertCircle } from 'lucide-react';
import ConfirmModal from '@/components/layout/ConfirmModal';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showModal, setShowModal] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

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

  // Appointment form
  const [category, setCategory] = useState<'CONSULTA' | 'EXAME' | 'TESTE'>('CONSULTA');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Pediatra');
  const [type, setType] = useState<'ROUTINE' | 'EMERGENCY'>('ROUTINE');
  const [description, setDescription] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CONSULTA' | 'EXAME' | 'TESTE'>('ALL');


  // Pre-consultation questions checklist states
  const [newQuestion, setNewQuestion] = useState('');
  const [questionsList, setQuestionsList] = useState<{ text: string; done: boolean }[]>([]);
  const [postNotesText, setPostNotesText] = useState('');

  async function loadAppointments(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const stored = localStorage.getItem('activeBabyId');
      const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';

      let currentBaby = null;
      try {
        const babyRes = await fetch('/api/babies');
        const babies = await babyRes.json();
        if (Array.isArray(babies) && babies.length > 0) {
          currentBaby = babies.find((b: any) => b.id === activeBabyId) || babies[0];
        }
      } catch (err) {}

      setBaby(currentBaby);

      const targetId = currentBaby?.id || activeBabyId;
      const res = await fetch(`/api/appointments${targetId ? `?babyId=${targetId}` : ''}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAppointments([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments(true);

    const interval = setInterval(() => {
      loadAppointments(false);
    }, 4000);

    let unsub: any = null;
    const stored = localStorage.getItem('activeBabyId');
    const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';

    if (activeBabyId) {
      try {
        const q = query(collection(db, 'medical_appointments'), where('babyId', '==', activeBabyId));
        unsub = onSnapshot(q, () => loadAppointments(false));
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (selectedAppt) {
      try {
        const parsed = JSON.parse(selectedAppt.preNotes || '[]');
        setQuestionsList(Array.isArray(parsed) ? parsed : []);
      } catch {
        setQuestionsList(selectedAppt.preNotes ? [{ text: selectedAppt.preNotes, done: false }] : []);
      }
      setPostNotesText(selectedAppt.postNotes || '');
    }
  }, [selectedAppt]);

  // Calendar month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Create grid cells for the active month (Google Calendar style)
  const getMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid: { date: Date; isCurrentMonth: boolean; dayNumber: number }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
        dayNumber: daysInPrevMonth - i,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
        dayNumber: d,
      });
    }

    const remaining = (7 - (grid.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      grid.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
        dayNumber: d,
      });
    }

    return grid;
  };

  const monthGrid = getMonthGrid();

  const filteredAppointments = appointments.filter((appt) => {
    if (filterCategory === 'ALL') return true;
    const apptCat = appt.category || 'CONSULTA';
    return apptCat === filterCategory;
  });

  const getAppointmentsForDate = (date: Date) => {
    const targetY = date.getFullYear();
    const targetM = date.getMonth();
    const targetD = date.getDate();

    return filteredAppointments.filter((appt) => {
      const apptDate = new Date(appt.appointmentDate);
      return (
        apptDate.getFullYear() === targetY &&
        apptDate.getMonth() === targetM &&
        apptDate.getDate() === targetD
      );
    });
  };

  function handleOpenCreate(defaultDate?: Date) {
    setEditingApptId(null);
    setCategory('CONSULTA');
    setDoctorName('');
    setSpecialty('Pediatra');
    setType('ROUTINE');
    setDescription('');
    
    if (defaultDate) {
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      setAppointmentDate(`${year}-${month}-${day}T09:00`);
    } else {
      setAppointmentDate('');
    }
    setShowModal(true);
  }

  function handleOpenEdit(appt: any) {
    setEditingApptId(appt.id);
    setCategory(appt.category || 'CONSULTA');
    setDoctorName(appt.doctorName);
    setSpecialty(appt.specialty || 'Pediatra');
    setType(appt.type || 'ROUTINE');
    setDescription(appt.description || '');
    setAppointmentDate(new Date(appt.appointmentDate).toISOString().slice(0, 16));
    setShowModal(true);
  }

  async function handleSaveAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!doctorName || !appointmentDate) return;

    const targetBabyId = baby?.id || localStorage.getItem('activeBabyId') || 'demo-baby-id';

    setSubmitting(true);
    try {
      if (editingApptId) {
        await fetch('/api/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingApptId,
            category,
            doctorName,
            specialty,
            type,
            description,
            appointmentDate,
          }),
        });
      } else {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            babyId: targetBabyId,
            category,
            doctorName,
            specialty,
            type,
            description,
            appointmentDate,
            preNotes: JSON.stringify([]),
          }),
        });
      }

      setShowModal(false);
      setEditingApptId(null);
      await loadAppointments(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }


  async function handleDeleteAppointment(id: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Consulta Médica',
      message: 'Tem certeza que deseja cancelar/remover esta consulta médica do histórico?',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' });
          await loadAppointments(false);
        } catch (e) {
          console.error(e);
        }
      },
    });
  }

  async function handleSaveNotes() {
    if (!selectedAppt?.id) return;
    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAppt.id,
          preNotes: JSON.stringify(questionsList),
          postNotes: postNotesText,
        }),
      });

      setSelectedAppt(null);
      await loadAppointments(false);
    } catch (e) {
      console.error(e);
    }
  }

  function toggleQuestion(index: number) {
    const updated = [...questionsList];
    updated[index].done = !updated[index].done;
    setQuestionsList(updated);
  }

  function addQuestion() {
    if (!newQuestion.trim()) return;
    setQuestionsList([...questionsList, { text: newQuestion.trim(), done: false }]);
    setNewQuestion('');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-rose-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando consultas médicas...</p>
      </div>
    );
  }

  const todayStr = new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
            Acompanhamento Clínico do Bebê
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
            <Stethoscope size={26} className="text-rose-500 dark:text-indigo-400" />
            Acompanhamento Médico
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Gerencie consultas, exames de laboratório/imagem e testes neonatais e de rotina
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter Tabs */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-800">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'CONSULTA', label: '🩺 Consultas' },
              { id: 'EXAME', label: '🧪 Exames' },
              { id: 'TESTE', label: '🔬 Testes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterCategory === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Calendário</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List size={15} />
              <span>Lista ({filteredAppointments.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreate()}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>+ Novo Registro</span>
          </button>
        </div>
      </div>

      {/* GOOGLE AGENDAS INTERACTIVE CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs dark:shadow-xl space-y-4">
          {/* Calendar Toolbar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="px-3 py-1 bg-rose-50 dark:bg-indigo-500/10 hover:bg-rose-100 dark:hover:bg-indigo-500/20 text-rose-600 dark:text-indigo-400 text-xs font-bold rounded-full border border-rose-200 dark:border-indigo-500/20 transition-all"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
                title="Mês Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
                title="Próximo Mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Days of Week) */}
          <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-slate-800/80 pb-2">
            {DAY_NAMES.map((day, idx) => (
              <span
                key={day}
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6
                    ? 'text-rose-400 dark:text-rose-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid Body (Month Cells) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthGrid.map((cell, idx) => {
              const dayAppts = getAppointmentsForDate(cell.date);
              const isToday = cell.date.toDateString() === todayStr;
              const isSelected = selectedDay && cell.date.toDateString() === selectedDay.toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(cell.date)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 dark:bg-slate-950/20 border-transparent text-slate-300 dark:text-slate-700 opacity-60'
                      : isSelected
                      ? 'bg-rose-50/60 dark:bg-slate-800/60 border-rose-300 dark:border-indigo-500 ring-2 ring-rose-400/30 dark:ring-indigo-500/30'
                      : isToday
                      ? 'bg-amber-50/50 dark:bg-slate-950/70 border-amber-300 dark:border-amber-500/50'
                      : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Day Header Cell */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-amber-500 text-white shadow-xs'
                          : isSelected
                          ? 'bg-rose-500 dark:bg-indigo-600 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick + Add Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(cell.date);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 dark:hover:text-indigo-400 transition"
                      title="Agendar neste dia"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Appointment Pills list in Cell */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[60px] sm:max-h-[75px] scrollbar-none">
                    {dayAppts.map((appt) => {
                      const isEmergency = appt.type === 'EMERGENCY';
                      const apptCat = appt.category || 'CONSULTA';
                      const timeStr = new Date(appt.appointmentDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const bgClass = isEmergency
                        ? 'bg-red-500 text-white'
                        : apptCat === 'EXAME'
                        ? 'bg-purple-600 text-white'
                        : apptCat === 'TESTE'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white';

                      const icon = isEmergency ? '🚨' : apptCat === 'EXAME' ? '🧪' : apptCat === 'TESTE' ? '🔬' : '🩺';

                      return (
                        <div
                          key={appt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppt(appt);
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 shadow-2xs transition-transform active:scale-95 ${bgClass}`}
                          title={`${icon} ${timeStr} - ${appt.doctorName} (${appt.specialty || 'Geral'})`}
                        >
                          <span className="shrink-0">{icon} {timeStr}</span>
                          <span className="truncate">{appt.doctorName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Day Agenda Drawer Below Calendar Grid */}
          {selectedDay && (
            <div className="mt-4 pt-4 border-t border-rose-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar size={15} className="text-rose-500 dark:text-indigo-400" />
                  Agenda para {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h4>
                <button
                  onClick={() => handleOpenCreate(selectedDay)}
                  className="text-xs font-bold text-rose-500 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Nova Consulta para este dia
                </button>
              </div>

              {getAppointmentsForDate(selectedDay).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhuma consulta agendada para esta data.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getAppointmentsForDate(selectedDay).map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            appt.type === 'EMERGENCY'
                              ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          }`}>
                            {appt.type === 'EMERGENCY' ? 'Emergência' : 'Rotina'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{appt.doctorName}</h5>
                        <p className="text-[11px] text-slate-500 font-medium">{appt.specialty || 'Pediatra'}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedAppt(appt)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-500 dark:text-indigo-400 bg-rose-50 dark:bg-indigo-500/10 rounded-xl border border-rose-200 dark:border-indigo-500/20"
                        >
                          Checklist
                        </button>
                        <button
                          onClick={() => handleOpenEdit(appt)}
                          className="p-1.5 text-slate-400 hover:text-indigo-500"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.length === 0 ? (
            <div className="md:col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-slate-800 text-slate-400 text-xs font-medium">
              Nenhuma consulta agendada ou registrada.
            </div>
          ) : (
            appointments.map((appt) => {
              let preQuestions: any[] = [];
              try {
                preQuestions = JSON.parse(appt.preNotes || '[]');
              } catch {
                preQuestions = appt.preNotes ? [{ text: appt.preNotes, done: false }] : [];
              }

              const isEmergency = appt.type === 'EMERGENCY';
              const apptCat = appt.category || 'CONSULTA';

              const categoryBadge = isEmergency
                ? { label: '🚨 Emergência / P.S.', style: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30' }
                : apptCat === 'EXAME'
                ? { label: '🧪 Exame de Saúde', style: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-500/30' }
                : apptCat === 'TESTE'
                ? { label: '🔬 Teste Neonatal', style: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' }
                : { label: '🩺 Consulta Médica', style: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' };

              return (
                <div
                  key={appt.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 space-y-3 shadow-xs dark:shadow-xl transition-all ${
                    isEmergency
                      ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-slate-900'
                      : 'border-rose-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryBadge.style}`}>
                          {categoryBadge.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {appt.specialty || 'Pediatria'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-1">{appt.doctorName}</h3>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar size={13} />
                        {new Date(appt.appointmentDate).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {appt.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                          "{appt.description}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(appt)}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg"
                        title="Editar Consulta"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                        title="Excluir Consulta"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-rose-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 font-medium">
                      {preQuestions.length} dúvida(s) de checklist
                    </span>
                    <button
                      onClick={() => setSelectedAppt(appt)}
                      className="text-xs font-bold text-rose-500 dark:text-indigo-400 bg-rose-50 dark:bg-indigo-500/10 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-indigo-500/20"
                    >
                      Dúvidas & Resumo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                🩺 {editingApptId ? 'Editar Consulta' : 'Nova Consulta Médica'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-3">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Categoria do Registro</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CONSULTA', label: '🩺 Consulta' },
                    { id: 'EXAME', label: '🧪 Exame' },
                    { id: 'TESTE', label: '🔬 Teste' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        category === cat.id
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 font-black'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Routine vs Emergency selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Tipo de Atendimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('ROUTINE')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      type === 'ROUTINE'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🌱 Rotina / Agendado
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('EMERGENCY')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      type === 'EMERGENCY'
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🚨 Emergência / P.S.
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {category === 'EXAME' ? 'Nome do Exame / Laboratório' : category === 'TESTE' ? 'Nome do Teste / Clínica' : 'Nome do(a) Médico(a)'}
                </label>
                <input
                  type="text"
                  placeholder={category === 'EXAME' ? 'Ex: Ultrassom Abdominal / Fleury' : category === 'TESTE' ? 'Ex: Teste do Pezinho Ampliado' : 'Ex: Dra. Camila Pediatra'}
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {category === 'EXAME' ? 'Tipo / Área do Exame' : category === 'TESTE' ? 'Tipo / Triagem' : 'Especialidade'}
                </label>
                <input
                  type="text"
                  placeholder={category === 'EXAME' ? 'Ex: Imagem / Sangue' : category === 'TESTE' ? 'Ex: Neonatal' : 'Ex: Pediatria / Neurologia'}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Data e Horário</label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Descrição / Sintomas / Motivo</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Check-up mensal de 5 meses ou febre repentina de 38°C..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium resize-none"
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
                  {submitting ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions & Notes Drawer */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedAppt.doctorName}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Antes & Pós Consulta</p>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-500 dark:text-indigo-400 uppercase tracking-wider block">
                📋 Dúvidas "Antes da Consulta"
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova pergunta..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-rose-500 dark:bg-indigo-600 text-white px-3 text-xs font-bold rounded-xl"
                >
                  +
                </button>
              </div>

              <div className="space-y-1.5 mt-2">
                {questionsList.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleQuestion(idx)}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-slate-800/40 text-xs font-medium"
                  >
                    {q.done ? (
                      <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Square size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span className={q.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>{q.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-rose-100 dark:border-slate-800">
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                🩺 Resumo Pós-Consulta (Orientações)
              </label>
              <textarea
                rows={3}
                placeholder="Prescrições e orientações do médico..."
                value={postNotesText}
                onChange={(e) => setPostNotesText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium resize-none"
              ></textarea>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppt(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 rounded-xl shadow-md"
              >
                Salvar Alterações
              </button>
            </div>
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
