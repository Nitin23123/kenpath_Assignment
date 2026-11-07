import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
        <p className="font-bold text-slate-200">{label}</p>
        <p className="text-emerald-400 font-semibold">{data.slot}</p>
        <p className="text-sm font-black text-white">
          {data.value} <span className="text-[10px] text-slate-400 font-normal">mg/dl</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function TrendChart({ trends }) {
  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-1">Blood Glucose Trend Curve</h4>
        <p className="text-xs text-slate-500 mb-6">Visual tracking of your month-to-date glucose levels</p>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No trend readings available for this period
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = trends.map((item, idx) => {
    const [y, m, d] = item.reading_date.split('-');
    return {
      index: idx,
      date: `${parseInt(d, 10)}/${parseInt(m, 10)}`,
      slot: item.slot,
      value: item.value,
      fullDate: item.reading_date
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h4 className="text-base font-bold text-slate-900">Glucose Trend Curve</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Month-to-date readings with clinical target boundary (70–140 mg/dl)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>
            <span className="text-slate-600 font-medium">Target Zone (70-140)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-600 rounded"></span>
            <span className="text-slate-600 font-medium">Glucose Reading</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              domain={[40, 260]}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              unit=" mg"
            />
            {/* Target Normal Band */}
            <ReferenceArea y1={70} y2={140} fill="#ecfdf5" fillOpacity={0.8} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={70} stroke="#38bdf8" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
