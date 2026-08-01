'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, Plus, Calendar, CheckSquare, Square, Trash2, Edit2, AlertCircle, FileText } from 'lucide-react';
import ConfirmModal from '@/components/layout/ConfirmModal';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

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
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Pediatra');
  const [type, setType] = useState<'ROUTINE' | 'EMERGENCY'>('ROUTINE');
  const [description, setDescription] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-consultation questions checklist states
  const [newQuestion, setNewQuestion] = useState('');
  const [questionsList, setQuestionsList] = useState<{ text: string; done: boolean }[]>([]);
  const [postNotesText, setPostNotesText] = useState('');

  async function loadAppointments() {
    setLoading(true);
    try {
      const activeBabyId = localStorage.getItem('activeBabyId') || '';
      const babyRes = await fetch(`/api/bowel-movements?babyId=${activeBabyId}`);
      const babyData = await babyRes.json();
      setBaby(babyData.baby);

      const res = await fetch(`/api/appointments?babyId=${babyData?.baby?.id || ''}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
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

  function handleOpenCreate() {
    setEditingApptId(null);
    setDoctorName('');
    setSpecialty('Pediatra');
    setType('ROUTINE');
    setDescription('');
    setAppointmentDate('');
    setShowModal(true);
  }

  function handleOpenEdit(appt: any) {
    setEditingApptId(appt.id);
    setDoctorName(appt.doctorName);
    setSpecialty(appt.specialty || 'Pediatra');
    setType(appt.type || 'ROUTINE');
    setDescription(appt.description || '');
    setAppointmentDate(new Date(appt.appointmentDate).toISOString().slice(0, 16));
    setShowModal(true);
  }

  async function handleSaveAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!baby?.id || !doctorName || !appointmentDate) return;

    setSubmitting(true);
    try {
      if (editingApptId) {
        await fetch('/api/appointments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingApptId,
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
            babyId: baby.id,
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
      await loadAppointments();
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
          await loadAppointments();
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
      await loadAppointments();
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Stethoscope size={24} className="text-rose-400 dark:text-indigo-400" />
            Consultas Médicas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Agendamento de rotina/emergência e checklist "Antes da Consulta"</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-gradient-to-r from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Agendar Consulta</span>
        </button>
      </div>

      {/* Appointments List */}
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
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isEmergency
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      }`}>
                        {isEmergency ? '🚨 Emergência / Pronto Socorro' : '🌱 Consulta de Rotina'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {appt.specialty || 'Pediatra'}
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
              {/* Routine vs Emergency selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Tipo de Consulta</label>
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
                    🌱 Consulta de Rotina
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome do(a) Médico(a)</label>
                <input
                  type="text"
                  placeholder="Ex: Dra. Camila Pediatra"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Especialidade</label>
                <input
                  type="text"
                  placeholder="Ex: Pediatria / Dermatologia Infantil"
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
