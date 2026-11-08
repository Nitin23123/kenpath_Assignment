import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ReadingsTable from '../components/ReadingsTable';
import ReadingFormModal from '../components/ReadingFormModal';
import { Plus, CheckCircle2 } from 'lucide-react';

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
    showToast(editingReading ? 'Reading updated.' : 'Reading recorded.');
    fetchReadings(pagination.page);
    fetchTodayStatus();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-royal-900 border border-royal-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-royal-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Royal Hero Header */}
        <div className="bg-gradient-to-r from-royal-950 via-royal-900 to-slate-900 rounded-xl p-6 sm:p-7 border border-royal-800/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="text-royal-200/80 text-sm max-w-xl">
              Track your daily blood glucose entries across 4 dedicated meal and fasting slots.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="px-4 py-2.5 rounded-lg bg-slate-900/80 border border-royal-800 text-center">
              <div className="text-[11px] uppercase font-semibold tracking-wider text-royal-300">
                Today's Slots
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {todayCount} <span className="text-xs font-normal text-royal-300">/ 4 logged</span>
              </div>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-lg bg-royal-600 hover:bg-royal-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Reading</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-white">Readings Log</h2>
            <p className="text-xs text-slate-400">
              {pagination.total} total recorded readings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-royal-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
              >
                Clear
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
