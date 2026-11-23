import React from 'react';
import { Clock, Plus, CheckCircle2, Edit2 } from 'lucide-react';

const SLOTS = [
  { name: 'Morning (fasting)', label: 'Fasting', target: '70–99' },
  { name: 'After breakfast', label: 'Post-Breakfast', target: '< 140' },
  { name: 'After lunch', label: 'Post-Lunch', target: '< 140' },
  { name: 'After dinner', label: 'Post-Dinner', target: '< 140' }
];

export function SlotSummaryCards({ todayReadings = [], onAddSlot, onEditReading }) {
  // Map today's readings by slot name
  const readingsBySlot = {};
  todayReadings.forEach(r => {
    readingsBySlot[r.slot] = r;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {SLOTS.map((slotItem, index) => {
        const reading = readingsBySlot[slotItem.name];
        const isRecorded = !!reading;

        return (
          <div
            key={slotItem.name}
            className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
              isRecorded
                ? 'bg-white border-emerald-200/80 shadow-emerald-500/5'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Slot {index + 1} • {slotItem.label}
                </span>
                {isRecorded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-300" />
                )}
              </div>

              <h4 className="font-semibold text-slate-800 text-sm mt-1">{slotItem.name}</h4>
              <p className="text-[11px] text-slate-400">Target: {slotItem.target} mg/dl</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              {isRecorded ? (
                <>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-slate-900">{reading.value}</span>
                    <span className="text-xs text-slate-400 font-medium">mg/dl</span>
                  </div>
                  <button
                    onClick={() => onEditReading(reading)}
                    title="Edit reading"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-400 font-medium">Not logged</span>
                  <button
                    onClick={() => onAddSlot(slotItem.name)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
