'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeaderAgendaWidget() {
  const [time, setTime] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatação do Relógio HH:MM:SS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Formatação da Data (Ex: Sábado, 1 de Agosto de 2026)
  const formatDateFull = (date: Date) => {
    const str = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Navegação no mini calendário estilo agenda
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="relative flex flex-wrap items-center gap-3 bg-white/90 dark:bg-slate-900/90 border border-rose-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-sm backdrop-blur-md">
      {/* Relógio Digital em Tempo Real */}
      <div className="flex items-center space-x-2 border-r border-rose-100 dark:border-slate-800 pr-3">
        <Clock className="w-4 h-4 text-rose-500 dark:text-indigo-400 animate-pulse" />
        <span className="text-sm font-mono font-extrabold text-slate-800 dark:text-slate-100 tracking-wider">
          {time ? formatTime(time) : '00:00:00'}
        </span>
      </div>

      {/* Calendário no Formato Agenda com Navegação */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevDay}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
          title="Dia Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-indigo-400 transition"
          title="Ver Detalhes da Agenda"
        >
          <CalendarIcon className="w-4 h-4 text-amber-500" />
          <span>{formatDateFull(selectedDate)}</span>
        </button>

        <button
          onClick={handleNextDay}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
          title="Próximo Dia"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Botão Hoje */}
        <button
          onClick={handleToday}
          className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-indigo-500/20 text-rose-600 dark:text-indigo-300 border border-rose-200 dark:border-indigo-500/30 hover:bg-rose-200 transition"
        >
          Hoje
        </button>
      </div>

      {/* Dropdown Mini Agenda (Se Clicar na Data) */}
      {showCalendarDropdown && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-3 w-64">
          <div className="flex justify-between items-center pb-2 border-b border-rose-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-100">📅 Agenda de Acompanhamento</span>
            <button onClick={() => setShowCalendarDropdown(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Você está visualizando a agenda do dia: <br />
            <strong className="text-slate-800 dark:text-slate-200">{selectedDate.toLocaleDateString('pt-BR')}</strong>
          </p>
          <div className="p-2.5 bg-rose-50 dark:bg-slate-950/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300">
            💡 Todos os registros de amamentação, fraldas e sonecas estão sendo rastreados para este período.
          </div>
        </div>
      )}
    </div>
  );
}
