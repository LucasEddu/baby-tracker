'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Calendar, MapPin, Scale, Ruler, Edit2, Trash2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function GrowthPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [weightGrams, setWeightGrams] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircCm, setHeadCircCm] = useState('');
  const [source, setSource] = useState<'HOME' | 'DOCTOR'>('HOME');
  const [submitting, setSubmitting] = useState(false);

  async function loadGrowth(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const stored = localStorage.getItem('activeBabyId');
      const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
      const babyRes = await fetch(`/api/bowel-movements${activeBabyId ? `?babyId=${activeBabyId}` : ''}`);
      const babyData = await babyRes.json();
      setBaby(babyData?.baby || null);

      const growthRes = await fetch(`/api/growth${babyData?.baby?.id ? `?babyId=${babyData.baby.id}` : ''}`);
      const growthData = await growthRes.json();
      setRecords(Array.isArray(growthData) ? growthData : []);
    } catch (e) {
      console.error(e);
      setRecords([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadGrowth(true);

    const interval = setInterval(() => {
      loadGrowth(false);
    }, 4000);

    let unsub: any = null;
    const stored = localStorage.getItem('activeBabyId');
    const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
    if (activeBabyId) {
      try {
        const q = query(collection(db, 'growth_records'), where('babyId', '==', activeBabyId));
        unsub = onSnapshot(q, () => loadGrowth(false));
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setWeightGrams('');
    setHeightCm('');
    setHeadCircCm('');
    setSource('HOME');
    setShowModal(true);
  }

  function handleOpenEdit(r: any) {
    setEditingId(r.id);
    setWeightGrams(r.weightGrams.toString());
    setHeightCm(r.heightCm.toString());
    setHeadCircCm(r.headCircCm ? r.headCircCm.toString() : '');
    setSource(r.source || 'HOME');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!baby?.id || !weightGrams || !heightCm) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await fetch('/api/growth', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            weightGrams,
            heightCm,
            headCircCm: headCircCm || null,
            source,
          }),
        });
      } else {
        await fetch('/api/growth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            babyId: baby.id,
            weightGrams,
            heightCm,
            headCircCm: headCircCm || null,
            source,
          }),
        });
      }

      setShowModal(false);
      setEditingId(null);
      await loadGrowth();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta medição?')) return;
    try {
      await fetch(`/api/growth?id=${id}`, { method: 'DELETE' });
      await loadGrowth();
    } catch (e) {
      console.error(e);
    }
  }

  const safeRecords = Array.isArray(records) ? records : [];

  const chartData = safeRecords.map((r) => ({
    date: new Date(r.measuredAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    pesoKg: +(r.weightGrams / 1000).toFixed(2),
    alturaCm: r.heightCm,
    perimetroCm: r.headCircCm || null,
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-rose-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Carregando gráficos de crescimento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={24} className="text-rose-400 dark:text-indigo-400" />
            Crescimento & Antropometria
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Evolução do peso, altura e perímetro cefálico</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-gradient-to-r from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Nova Medição</span>
        </button>
      </div>

      {/* Grid for Desktop Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <Scale size={16} /> Curva de Evolução do Peso (kg)
          </h3>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Nenhum registro de peso cadastrado</div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderRadius: '0.75rem', fontSize: '12px', color: '#0f172a' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pesoKg"
                    name="Peso (kg)"
                    stroke="#fb7185"
                    strokeWidth={3}
                    dot={{ fill: '#fb7185', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Height & Head Circumference Chart */}
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
            <Ruler size={16} /> Estatura (cm) & Perímetro Cefálico (cm)
          </h3>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Nenhum registro cadastrado</div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderRadius: '0.75rem', fontSize: '12px', color: '#0f172a' }}
                  />
                  <Line type="monotone" dataKey="alturaCm" name="Altura (cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="perimetroCm" name="Perímetro Cefálico (cm)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* History Grid */}
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">Histórico Completo de Medições</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {records.map((r) => (
            <div key={r.id} className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs hover:border-rose-200 dark:hover:border-slate-700 transition-all">
              <div>
                <span className="text-slate-400 block text-[10px] mb-1 font-mono">
                  {new Date(r.measuredAt).toLocaleDateString('pt-BR')}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {(r.weightGrams / 1000).toFixed(2)} kg • {r.heightCm} cm
                </span>
                {r.headCircCm && <span className="text-slate-500 dark:text-slate-400 block text-xs mt-0.5 font-medium">PC: {r.headCircCm} cm</span>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  r.source === 'DOCTOR'
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}>
                  {r.source === 'DOCTOR' ? 'Consulta 🩺' : 'Em Casa 🏠'}
                </span>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(r)} className="p-1 text-slate-400 hover:text-indigo-500">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📏 {editingId ? 'Editar Medição' : 'Nova Medição Antropométrica'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Peso (em Gramas)</label>
                <input
                  type="number"
                  placeholder="Ex: 5800 para 5,8kg"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Estatura / Altura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 60.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Perímetro Cefálico (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 40.2"
                  value={headCircCm}
                  onChange={(e) => setHeadCircCm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Origem da Medição</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSource('HOME')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      source === 'HOME' ? 'bg-rose-100 dark:bg-indigo-500/20 text-rose-600 dark:text-indigo-300 border-rose-300 dark:border-indigo-500/40' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Em Casa 🏠
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource('DOCTOR')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      source === 'DOCTOR' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-500/40' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Consulta Médica 🩺
                  </button>
                </div>
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
                  {submitting ? 'Salvando...' : 'Salvar Medição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
