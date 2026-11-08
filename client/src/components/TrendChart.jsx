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
      <div className="bg-slate-950 text-white p-2.5 rounded-lg border border-slate-700 shadow-xl text-xs space-y-0.5">
        <p className="font-semibold text-slate-300">{label}</p>
        <p className="text-royal-300 font-medium">{data.slot}</p>
        <p className="text-sm font-bold text-white">
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
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-white mb-0.5">Glucose Trend Curve</h4>
        <p className="text-xs text-slate-400 mb-4">Month-to-date readings tracking</p>
        <div className="h-64 flex items-center justify-center text-xs text-slate-500 bg-slate-950/60 rounded-lg border border-dashed border-slate-800">
          No trend readings available for this period
        </div>
      </div>
    );
  }

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
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h4 className="text-sm font-bold text-white">Month-to-Date Glucose Curve</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Target range: 70–140 mg/dl
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-royal-950 border border-royal-700"></span>
            <span className="text-slate-400">Target (70-140)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-royal-500 rounded"></span>
            <span className="text-slate-400">Reading</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              domain={[40, 260]}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              unit=" mg"
            />
            <ReferenceArea y1={70} y2={140} fill="#131944" fillOpacity={0.7} />
            <ReferenceLine y={140} stroke="#4361ee" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={70} stroke="#38bdf8" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4361ee"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#4361ee', strokeWidth: 1.5, stroke: '#0f172a' }}
              activeDot={{ r: 5, fill: '#6f92fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
