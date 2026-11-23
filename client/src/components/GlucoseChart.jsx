import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export function GlucoseChart({ readings = [], title = 'Glucose Trend' }) {
  if (!readings || readings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        No readings available to plot trend chart.
      </div>
    );
  }

  // Format data points chronologically
  const chartData = readings.map((r, i) => ({
    index: i + 1,
    date: r.date,
    label: `${r.date.slice(5)} (${r.slot.split(' ')[0]})`,
    slot: r.slot,
    value: r.value
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-lg border border-slate-800 space-y-1">
          <p className="font-semibold text-slate-300">{data.date}</p>
          <p className="text-emerald-400 font-medium">{data.slot}</p>
          <p className="text-sm font-bold">{data.value} mg/dl</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <p className="text-xs text-slate-400">
            Blood glucose fluctuations across time slots (Reference: Target normal &lt; 140 mg/dl)
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Recorded Value</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-400">
            <span className="w-3 border-b-2 border-dashed border-emerald-400 inline-block"></span>
            <span>Target Line (140)</span>
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              domain={[40, 'auto']}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              unit=" mg"
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Reference line for normal post-meal target */}
            <ReferenceLine
              y={140}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{
                value: 'Target 140',
                position: 'insideTopRight',
                fill: '#10b981',
                fontSize: 10
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
