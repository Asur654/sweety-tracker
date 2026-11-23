import React from 'react';
import { TrendingUp, TrendingDown, Activity, Hash } from 'lucide-react';

export function ReportStatCards({ stats }) {
  if (!stats) return null;

  const { highest, lowest, average, count, isEmpty } = stats;

  const cards = [
    {
      title: 'Highest Reading',
      value: highest !== null && highest !== undefined ? `${highest}` : '—',
      unit: highest !== null ? 'mg/dl' : '',
      icon: TrendingUp,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      desc: 'Peak measurement'
    },
    {
      title: 'Lowest Reading',
      value: lowest !== null && lowest !== undefined ? `${lowest}` : '—',
      unit: lowest !== null ? 'mg/dl' : '',
      icon: TrendingDown,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      desc: 'Minimum measurement'
    },
    {
      title: 'Average Glucose',
      value: average !== null && average !== undefined ? `${average}` : '—',
      unit: average !== null ? 'mg/dl' : '',
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      desc: 'Rounded to 1 decimal'
    },
    {
      title: 'Total Readings',
      value: `${count}`,
      unit: count === 1 ? 'reading' : 'readings',
      icon: Hash,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      desc: 'Recorded count'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    {card.unit}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
