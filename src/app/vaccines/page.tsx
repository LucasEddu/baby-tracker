'use client';

import { useState, useEffect } from 'react';
import { Syringe, CheckCircle2, Clock, Plus, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function VaccinesPage() {
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVaccine, setSelectedVaccine] = useState<any>(null);
  
  // Accordions open/close state map: { 0: true, 2: true, ... }
  const [openGroups, setOpenGroups] = useState<{ [key: number]: boolean }>({
    0: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    9: true,
    12: true,
    15: true,
  });

  // Application modal form
  const [lotNumber, setLotNumber] = useState('');
  const [location, setLocation] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadVaccines() {
    setLoading(true);
    try {
      const activeBabyId = localStorage.getItem('activeBabyId') || '';
      const babyRes = await fetch(`/api/bowel-movements?babyId=${activeBabyId}`);
      const babyData = await babyRes.json();
      setBaby(babyData.baby);

      const res = await fetch(`/api/vaccines?babyId=${babyData?.baby?.id || ''}`);
      const data = await res.json();
      setVaccines(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setVaccines([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVaccines();
  }, []);

  function toggleGroup(ageMonth: number) {
    setOpenGroups((prev) => ({
      ...prev,
      [ageMonth]: !prev[ageMonth],
    }));
  }

  async function handleApplyVaccine(e: React.FormEvent) {
    e.preventDefault();
    if (!baby?.id || !selectedVaccine?.id) return;

    setSubmitting(true);
    try {
      await fetch('/api/vaccines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId: baby.id,
          vaccineId: selectedVaccine.id,
          lotNumber,
          location,
          sideEffects,
        }),
      });

      setSelectedVaccine(null);
      setLotNumber('');
      setLocation('');
      setSideEffects('');
      await loadVaccines();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-rose-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando carteira de vacinação...</p>
      </div>
    );
  }

  const appliedCount = vaccines.filter((v) => v.applied).length;
  const totalCount = vaccines.length;

  // Group vaccines by targetAgeMonths
  const groupedMap: { [ageMonths: number]: any[] } = {};
  vaccines.forEach((v) => {
    const age = v.targetAgeMonths || 0;
    if (!groupedMap[age]) groupedMap[age] = [];
    groupedMap[age].push(v);
  });

  const ageGroups = Object.keys(groupedMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              Carteira de Vacinas
            </span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 dark:text-emerald-400" size={22} />
              Calendário Infantil de Imunização
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {appliedCount} de {totalCount} vacinas recomendadas aplicadas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
            {Math.round((appliedCount / (totalCount || 1)) * 100)}%
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 mt-4 overflow-hidden border border-slate-200 dark:border-slate-800">
          <div
            className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${(appliedCount / (totalCount || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Accordion List grouped by Age */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Vacinas Agrupadas por Idade Recomentada
        </h3>

        {ageGroups.map((ageMonth) => {
          const list = groupedMap[ageMonth];
          const groupAppliedCount = list.filter((item) => item.applied).length;
          const isGroupAllApplied = groupAppliedCount === list.length;
          const isOpen = !!openGroups[ageMonth];

          const groupTitle = ageMonth === 0 ? 'Ao Nascer 👶' : `${ageMonth} Meses 🗓️`;

          return (
            <div
              key={ageMonth}
              className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs dark:shadow-xl transition-all"
            >
              {/* Accordion Header Button */}
              <button
                onClick={() => toggleGroup(ageMonth)}
                className="w-full px-6 py-4 flex items-center justify-between bg-rose-50/50 dark:bg-slate-950/40 hover:bg-rose-100/50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isGroupAllApplied
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-rose-100 dark:bg-indigo-500/20 text-rose-600 dark:text-indigo-300 border border-rose-200 dark:border-indigo-500/30'
                    }`}
                  >
                    {isGroupAllApplied ? '✓' : list.length}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{groupTitle}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {groupAppliedCount} de {list.length} vacinas tomadas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-semibold hidden sm:inline">
                    {isOpen ? 'Ocultar' : 'Ver vacinas'}
                  </span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-rose-100 dark:border-slate-800">
                  {list.map((v) => (
                    <div
                      key={v.id}
                      className={`border rounded-2xl p-4 transition-all ${
                        v.applied
                          ? 'bg-emerald-50/40 dark:bg-slate-950/60 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{v.name}</h5>
                          {v.description && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{v.description}</p>}

                          {v.applied && v.applicationDetails && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium space-y-0.5">
                              <p>✓ Aplicada em: {new Date(v.applicationDetails.appliedAt).toLocaleDateString('pt-BR')}</p>
                              {v.applicationDetails.lotNumber && <p>Lote: {v.applicationDetails.lotNumber}</p>}
                              {v.applicationDetails.location && <p>Local: {v.applicationDetails.location}</p>}
                              {v.applicationDetails.sideEffects && <p className="text-amber-600 dark:text-amber-300 italic">Reação: "{v.applicationDetails.sideEffects}"</p>}
                            </div>
                          )}
                        </div>

                        {v.applied ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                            <CheckCircle2 size={14} /> Tomada
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedVaccine(v)}
                            className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-pink-500 dark:bg-indigo-600 px-3 py-1.5 rounded-xl shadow-xs shrink-0 active:scale-95"
                          >
                            <Plus size={14} /> Registrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply Vaccine Modal */}
      {selectedVaccine && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                💉 Aplicar: {selectedVaccine.name}
              </h3>
              <button onClick={() => setSelectedVaccine(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleApplyVaccine} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Número do Lote (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: LOTE-8941A"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Unidade de Saúde / Local</label>
                <input
                  type="text"
                  placeholder="Ex: UBS Central / Clínica Santa Maria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Reações ou Efeitos Colaterais</label>
                <input
                  type="text"
                  placeholder="Ex: Leve febre de 37.8°C no dia seguinte..."
                  value={sideEffects}
                  onChange={(e) => setSideEffects(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVaccine(null)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar Aplicação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
