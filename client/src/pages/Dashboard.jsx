import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ReadingsTable from '../components/ReadingsTable';
import ReadingFormModal from '../components/ReadingFormModal';
import {
  Plus,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';

const REQUIRED_SLOTS = [
  { key: 'Morning (fasting)', short: 'Fasting' },
  { key: 'After breakfast', short: 'Breakfast' },
  { key: 'After lunch', short: 'Lunch' },
  { key: 'After dinner', short: 'Dinner' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [todayReadings, setTodayReadings] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchReadings = useCallback(async (page = 1, date = filterDate) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (date) {
        params.date = date;
      }
      const res = await api.get('/readings', { params });
      if (res.data.success) {
        setReadings(res.data.readings);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load readings:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await api.get('/readings', { params: { date: todayStr, limit: 10 } });
      if (res.data.success) {
        setTodayReadings(res.data.readings);
      }
    } catch (err) {
      console.error('Failed to fetch today status:', err);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchReadings(1, filterDate);
    fetchTodayStatus();
  }, [fetchReadings, fetchTodayStatus, filterDate]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenAdd = () => {
    setEditingReading(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/readings/${id}`);
      showToast('Reading deleted successfully.');
      fetchReadings(pagination.page);
      fetchTodayStatus();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSaved = () => {
    showToast(editingReading ? 'Reading updated.' : 'Reading logged successfully.');
    fetchReadings(pagination.page);
    fetchTodayStatus();
  };

  // Compute today's quick summary
  const todayCount = todayReadings.length;
  const todayAverage = useMemo(() => {
    if (todayCount === 0) return null;
    const sum = todayReadings.reduce((acc, curr) => acc + curr.value, 0);
    return (sum / todayCount).toFixed(1);
  }, [todayReadings, todayCount]);

  const todaySlotsLogged = useMemo(() => {
    return new Set(todayReadings.map((r) => r.slot));
  }, [todayReadings]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-royal-500/30 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-royal-700/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn transition-all">
            <CheckCircle2 className="w-4 h-4 text-royal-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modern Minimal Bento Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Welcome & Primary CTA Card */}
          <div className="md:col-span-5 bg-gradient-to-br from-royal-950 via-slate-900 to-slate-900/90 rounded-2xl p-6 border border-royal-900/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1 relative z-10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-royal-400 block">
                Overview
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Hi, {user?.name || 'Patient'}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Maintain steady glycemic balance by logging all 4 daily slots.
              </p>
            </div>

            <div className="pt-6 relative z-10">
              <button
                onClick={handleOpenAdd}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 active:scale-[0.98] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-royal-950/50 hover:shadow-royal-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Log Glucose Reading</span>
              </button>
            </div>

            {/* Subtle background glow accent */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-royal-600/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* Today's 4-Slot Tracker Capsule */}
          <div className="md:col-span-4 bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Today's Slots
                </span>
                <span className="text-xs font-mono font-bold text-royal-300">
                  {todayCount} / 4 Completed
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {todayCount === 4
                  ? 'All designated daily slots recorded.'
                  : `${4 - todayCount} slot${4 - todayCount > 1 ? 's' : ''} remaining today.`}
              </p>
            </div>

            {/* 4 Segmented Interactive Slot Progress Pills */}
            <div className="grid grid-cols-4 gap-2 pt-4">
              {REQUIRED_SLOTS.map((slot) => {
                const isLogged = todaySlotsLogged.has(slot.key);
                return (
                  <div
                    key={slot.key}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                      isLogged
                        ? 'bg-royal-950/80 border-royal-600 text-royal-200 shadow-xs'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLogged ? 'bg-royal-400 animate-pulse' : 'bg-slate-700'
                        }`}
                      ></span>
                    </div>
                    <span className="text-[10px] font-semibold block truncate">
                      {slot.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mean Glucose / Target Indicator */}
          <div className="md:col-span-3 bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Today's Mean
              </span>
              <Activity className="w-4 h-4 text-royal-400" />
            </div>

            <div className="my-2">
              {todayAverage ? (
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-black text-white">{todayAverage}</span>
                  <span className="text-xs text-slate-500 font-sans">mg/dl</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium italic">
                  No readings logged yet
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Target Range</span>
              <span className="text-royal-300 font-medium">70–140 mg/dl</span>
            </div>
          </div>
        </div>

        {/* Content Workspace (Main Feed + Right Insight Rail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Feed Column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Minimal Filter & Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterDate('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !filterDate
                      ? 'bg-royal-950 text-royal-200 border border-royal-700/80 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setFilterDate(todayStr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterDate === todayStr
                      ? 'bg-royal-950 text-royal-200 border border-royal-700/80 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Today Only
                </button>
              </div>

              {/* Custom Date Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  max={todayStr}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-royal-500"
                />
                {filterDate && filterDate !== todayStr && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors border border-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Readings Ledger Table */}
            <ReadingsTable
              readings={readings}
              pagination={pagination}
              onPageChange={(p) => fetchReadings(p, filterDate)}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Right Rail: Reference Range & Reports Shortcut */}
          <div className="lg:col-span-4 space-y-4">
            {/* Clinical Target Scale Card */}
            <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Glycemic Reference Scale
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Standard clinical range breakdown</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-sky-950/40 border border-sky-800/40">
                  <div className="flex items-center gap-2 text-sky-300">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span className="font-medium">Hypoglycemia</span>
                  </div>
                  <span className="font-mono font-bold text-sky-200">&lt; 70 mg/dl</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-royal-950/60 border border-royal-700/60">
                  <div className="flex items-center gap-2 text-royal-200">
                    <span className="w-2 h-2 rounded-full bg-royal-400"></span>
                    <span className="font-semibold">Normal In-Range</span>
                  </div>
                  <span className="font-mono font-bold text-white">70 – 140 mg/dl</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-800/40">
                  <div className="flex items-center gap-2 text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="font-medium">Elevated</span>
                  </div>
                  <span className="font-mono font-bold text-amber-200">141 – 199 mg/dl</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/40 border border-rose-800/40">
                  <div className="flex items-center gap-2 text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span className="font-medium">High</span>
                  </div>
                  <span className="font-mono font-bold text-rose-200">≥ 200 mg/dl</span>
                </div>
              </div>
            </div>

            {/* Reports & Analytics Jump Card */}
            <Link
              to="/reports"
              className="bg-gradient-to-r from-royal-950 via-slate-900 to-slate-900 p-5 rounded-2xl border border-royal-800/70 shadow-sm flex items-center justify-between group hover:border-royal-600 transition-all duration-200 block"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-royal-400 block">
                  Analytical Reports
                </span>
                <h4 className="text-sm font-bold text-white group-hover:text-royal-300 transition-colors">
                  Daily & Monthly Trends
                </h4>
                <p className="text-[11px] text-slate-400">
                  View aggregated metrics and Recharts line curve
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-royal-600/20 text-royal-400 flex items-center justify-center group-hover:bg-royal-600 group-hover:text-white transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Reading Form Modal */}
      <ReadingFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initialReading={editingReading}
      />
    </div>
  );
}
