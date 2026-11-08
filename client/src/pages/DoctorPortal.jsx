import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ReportCard from '../components/ReportCard';
import TrendChart from '../components/TrendChart';
import api from '../services/api';
import { Users, Calendar, Clock, CalendarRange, ArrowLeft, User } from 'lucide-react';

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

export default function DoctorPortal() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch assigned patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get('/doctor/patients');
        if (res.data.success) {
          setPatients(res.data.patients);
          if (res.data.patients.length > 0 && !selectedPatient) {
            setSelectedPatient(res.data.patients[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  // Fetch reports when selected patient or date changes
  useEffect(() => {
    if (!selectedPatient) return;
    async function loadPatientReports() {
      try {
        const res = await api.get(`/doctor/patients/${selectedPatient.id}/reports`, {
          params: { date: selectedDate }
        });
        if (res.data.success) {
          setPatientData(res.data);
        }
      } catch (err) {
        console.error('Failed to load patient reports:', err);
      }
    }
    loadPatientReports();
  }, [selectedPatient, selectedDate]);

  const reports = patientData?.reports;
  const trends = patientData?.trends || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-royal-600 flex items-center justify-center text-white font-bold">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Doctor Oversight Portal</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Review assigned diabetes patient glucose logs & reports
              </p>
            </div>
          </div>

          {selectedPatient && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-400">Reference Date:</label>
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-royal-500"
              />
            </div>
          )}
        </div>

        {/* Layout: Patients selector + Patient Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patients List Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Patients ({patients.length})
            </h2>

            {patients.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 text-center">
                No patients currently assigned
              </div>
            ) : (
              <div className="space-y-2">
                {patients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                        isSelected
                          ? 'border-royal-500 bg-royal-950/80 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {p.total_readings} logs
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">{p.email}</p>
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                        <span>Last log:</span>
                        <span className="font-medium text-slate-300">
                          {p.last_reading_date ? formatDisplayDate(p.last_reading_date) : 'Never'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Patient Details & Reports */}
          <div className="lg:col-span-3 space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Summary Header */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-royal-300 font-semibold uppercase tracking-wider">
                      Viewing Patient File
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{selectedPatient.name}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-md bg-royal-950 border border-royal-700/80 text-royal-200 text-xs font-semibold">
                    {reports?.daily?.count || 0} readings logged on {formatDisplayDate(selectedDate)}
                  </span>
                </div>

                {/* 3 Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    title="Monthly (Prev Month)"
                    dateRange={`${formatDisplayDate(reports?.previousMonth?.startDate)} – ${formatDisplayDate(reports?.previousMonth?.endDate)}`}
                    stats={reports?.previousMonth}
                    icon={CalendarRange}
                  />
                </div>

                {/* Daily Slot Breakdown */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-white mb-3">
                    Daily Readings Breakdown – {formatDisplayDate(selectedDate)}
                  </h4>
                  {reports?.daily?.readings?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-lg border border-dashed border-slate-800">
                      No readings recorded for this patient on {formatDisplayDate(selectedDate)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {reports?.daily?.readings?.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                            <span>{r.slot}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-royal-400"></span>
                          </div>
                          <div className="my-2">
                            <span className="text-2xl font-bold text-white">{r.value}</span>
                            <span className="text-xs text-slate-500 ml-1">mg/dl</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Trend Curve */}
                <TrendChart trends={trends} />
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                Select a patient from the left to view their clinical reports
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
