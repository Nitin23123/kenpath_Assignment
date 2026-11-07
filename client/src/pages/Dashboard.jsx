import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ReadingsTable from '../components/ReadingsTable';
import ReadingFormModal from '../components/ReadingFormModal';
import { Plus, Calendar, Filter, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [todayCount, setTodayCount] = useState(0);

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
        setTodayCount(res.data.readings.length);
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
    showToast(editingReading ? 'Reading updated successfully.' : 'New reading recorded.');
    fetchReadings(pagination.page);
    fetchTodayStatus();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Welcome & Action Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-700/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Diabetes Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Patient'}!
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              Track up to 4 readings a day across breakfast, lunch, and dinner to stay in healthy range.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Today status badge */}
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                Today's Log
              </div>
              <div className="text-xl font-black mt-0.5">
                {todayCount} <span className="text-xs font-normal text-emerald-200">/ 4 slots</span>
              </div>
            </div>

            {/* Log Reading Button */}
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-bold shadow-lg shadow-slate-950/10 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Log Reading</span>
            </button>
          </div>
        </div>

        {/* Filter bar & table header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Glucose Readings</h2>
            <p className="text-xs text-slate-500">
              Viewing {pagination.total} total recorded readings
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Readings Table */}
        <ReadingsTable
          readings={readings}
          pagination={pagination}
          onPageChange={(p) => fetchReadings(p, filterDate)}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Modal */}
      <ReadingFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initialReading={editingReading}
      />
    </div>
  );
}
