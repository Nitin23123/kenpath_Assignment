import React from 'react';
import { TrendingUp, TrendingDown, Activity, Calendar, FileText } from 'lucide-react';

export default function ReportCard({ title, dateRange, stats, icon: Icon, badgeColor = 'emerald' }) {
  const hasData = stats && stats.count > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {Icon ? <Icon className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">{dateRange}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {stats?.count || 0} {stats?.count === 1 ? 'Reading' : 'Readings'}
          </span>
        </div>

        {/* Content */}
        {!hasData ? (
          <div className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center my-3">
            <FileText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No readings recorded</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No entries found for this time range.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 my-4">
            {/* Average */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Average
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-900">
                  {stats.average?.toFixed(1)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600">mg/dl</span>
              </div>
            </div>

            {/* Highest */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                <span>Highest</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">{stats.highest}</span>
                <span className="text-[10px] font-semibold text-slate-400">mg/dl</span>
              </div>
            </div>

            {/* Lowest */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <TrendingDown className="w-3.5 h-3.5 text-sky-500" />
                <span>Lowest</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">{stats.lowest}</span>
                <span className="text-[10px] font-semibold text-slate-400">mg/dl</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Target: 70–140 mg/dl</span>
        <span className="font-medium">
          {hasData ? (stats.average <= 140 ? 'In target range' : 'Above target') : '—'}
        </span>
      </div>
    </div>
  );
}
