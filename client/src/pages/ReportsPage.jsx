import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ReportCard from '../components/ReportCard';
import TrendChart from '../components/TrendChart';
import api from '../services/api';
import { Calendar, BarChart2, CalendarRange, Clock, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Date Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Glucose Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily, Month-to-date, and Previous Month summaries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Selected Date:
            </label>
            <div className="relative">
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 3 Summary Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Daily Report */}
          <ReportCard
            title="Daily Report"
            dateRange={formatDisplayDate(reports?.daily?.startDate)}
            stats={reports?.daily}
            icon={Clock}
          />

          {/* 2. Month-to-date Report */}
          <ReportCard
            title="Month-to-Date"
            dateRange={`${formatDisplayDate(reports?.monthToDate?.startDate)} – ${formatDisplayDate(reports?.monthToDate?.endDate)}`}
            stats={reports?.monthToDate}
            icon={Calendar}
          />

          {/* 3. Monthly (Previous Month) Report */}
          <ReportCard
            title="Monthly (Prev Month)"
            dateRange={`${formatDisplayDate(reports?.previousMonth?.startDate)} – ${formatDisplayDate(reports?.previousMonth?.endDate)}`}
            stats={reports?.previousMonth}
            icon={CalendarRange}
          />
        </div>

        {/* Daily Readings Breakdown (Assignment requirement: "The daily report also lists each reading with its slot") */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daily Slot Breakdown – {formatDisplayDate(selectedDate)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed readings for each slot on this day
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {reports?.daily?.readings?.length || 0} / 4 Slots Logged
            </span>
          </div>

          {reports?.daily?.readings?.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No readings recorded on {formatDisplayDate(selectedDate)}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reports?.daily?.readings?.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 truncate">{r.slot}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="my-3">
                    <span className="text-3xl font-black text-slate-900">{r.value}</span>
                    <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    {r.value < 70 ? (
                      <span className="text-sky-600 font-bold">Hypoglycemic (&lt;70)</span>
                    ) : r.value <= 140 ? (
                      <span className="text-emerald-600 font-bold">Normal In-Range</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Elevated</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bonus: Trend Chart over the Month */}
        <TrendChart trends={trends} />
      </main>
    </div>
  );
}
