import React from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Glucose Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze daily, month-to-date, and previous-month blood sugar trends
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Reports Dashboard Ready</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          The backend reports API is live. In Chunk 8, we will build the interactive date picker, high/low/average cards, and Recharts line graph.
        </p>
      </div>
    </div>
  );
}
