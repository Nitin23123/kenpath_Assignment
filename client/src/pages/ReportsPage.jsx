import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ReportCard from '../components/ReportCard';
import TrendChart from '../components/TrendChart';
import api from '../services/api';
import { Calendar, Clock, CalendarRange } from 'lucide-react';

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function ReportsPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: { date } });
      if (res.data.success) {
        setReportsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(selectedDate);
  }, [fetchReports, selectedDate]);

  const reports = reportsData?.reports;
  const trends = reportsData?.trends || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Date Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-white">
              Glucose Reports
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily, Month-to-date, and Previous Month statistical summaries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-400">
              Selected Date:
            </label>
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-royal-500"
            />
          </div>
        </div>

        {/* 3 Summary Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ReportCard
            title="Daily Report"
            dateRange={formatDisplayDate(reports?.daily?.startDate)}
            stats={reports?.daily}
            icon={Clock}
          />

          <ReportCard
            title="Month-to-Date"
            dateRange={`${formatDisplayDate(reports?.monthToDate?.startDate)} – ${formatDisplayDate(reports?.monthToDate?.endDate)}`}
            stats={reports?.monthToDate}
            icon={Calendar}
          />

          <ReportCard
            title="Monthly (Previous Month)"
            dateRange={`${formatDisplayDate(reports?.previousMonth?.startDate)} – ${formatDisplayDate(reports?.previousMonth?.endDate)}`}
            stats={reports?.previousMonth}
            icon={CalendarRange}
          />
        </div>

        {/* Daily Readings Breakdown */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Daily Slot Breakdown – {formatDisplayDate(selectedDate)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Itemized readings by slot
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {reports?.daily?.readings?.length || 0} / 4 Slots
            </span>
          </div>

          {reports?.daily?.readings?.length === 0 ? (
            <div className="p-7 text-center text-xs text-slate-500 bg-slate-950/60 rounded-lg border border-dashed border-slate-800">
              No readings recorded on {formatDisplayDate(selectedDate)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {reports?.daily?.readings?.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-lg border border-slate-800 bg-slate-950/70 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 truncate">{r.slot}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-royal-400"></span>
                  </div>
                  <div className="my-2.5">
                    <span className="text-2xl font-bold text-white">{r.value}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">mg/dl</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    {r.value < 70 ? (
                      <span className="text-sky-400">Low (&lt;70)</span>
                    ) : r.value <= 140 ? (
                      <span className="text-royal-300">Normal (70-140)</span>
                    ) : (
                      <span className="text-amber-400">Elevated</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bonus: Trend Chart */}
        <TrendChart trends={trends} />
      </main>
    </div>
  );
}
