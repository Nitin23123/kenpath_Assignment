import React from 'react';
import { TrendingUp, TrendingDown, Activity, FileText } from 'lucide-react';

export default function ReportCard({ title, dateRange, stats, icon: Icon }) {
  const hasData = stats && stats.count > 0;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-royal-950 border border-royal-800/80 text-royal-400 flex items-center justify-center">
              {Icon ? <Icon className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">{dateRange}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
            {stats?.count || 0} {stats?.count === 1 ? 'Reading' : 'Readings'}
          </span>
        </div>

        {/* Content */}
        {!hasData ? (
          <div className="py-7 px-4 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 text-center my-3">
            <FileText className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-400">No readings recorded</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              No entries found for this range
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 my-3.5">
            {/* Average */}
            <div className="p-3 rounded-lg bg-royal-950/70 border border-royal-800/80">
              <span className="text-[10px] font-semibold text-royal-300 uppercase tracking-wider block">
                Average
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">
                  {stats.average?.toFixed(1)}
                </span>
                <span className="text-[10px] text-royal-300/70 font-normal">mg/dl</span>
              </div>
            </div>

            {/* Highest */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-rose-400" />
                <span>Highest</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-200">{stats.highest}</span>
                <span className="text-[10px] text-slate-500 font-normal">mg/dl</span>
              </div>
            </div>

            {/* Lowest */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <TrendingDown className="w-3 h-3 text-sky-400" />
                <span>Lowest</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-200">{stats.lowest}</span>
                <span className="text-[10px] text-slate-500 font-normal">mg/dl</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">Target: 70–140 mg/dl</span>
        <span className="text-[11px] font-medium text-slate-300">
          {hasData ? (stats.average <= 140 ? 'In target range' : 'Above target') : '—'}
        </span>
      </div>
    </div>
  );
}
