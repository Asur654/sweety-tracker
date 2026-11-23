import React from 'react';
import { Calendar, Clock, Edit2, Trash2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export function ReadingsTable({
  readings = [],
  pagination = { total: 0, page: 1, limit: 20, totalPages: 1 },
  onPageChange,
  onEdit,
  onDelete,
  loading
}) {
  const getBadgeColor = (val, slot) => {
    // Normal fasting: 70-99, Post-meal: < 140
    const isFasting = slot.includes('fasting');
    if (isFasting) {
      if (val < 70) return 'bg-amber-50 text-amber-700 border-amber-200';
      if (val <= 99) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (val <= 125) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      return 'bg-rose-50 text-rose-700 border-rose-200';
    } else {
      if (val <= 140) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (val <= 199) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  if (readings.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No Readings Found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You haven't recorded any blood glucose readings for this period. Click "Add Reading" above to record your first measurement.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table for tablet / desktop */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Time Slot</th>
              <th className="px-6 py-3.5">Glucose Value</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {readings.map((reading) => (
              <tr key={reading.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2 text-slate-900 font-semibold">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{reading.date}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {reading.slot}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeColor(
                      reading.value,
                      reading.slot
                    )}`}
                  >
                    {reading.value} mg/dl
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="inline-flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(reading)}
                      title="Edit reading"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(reading)}
                      title="Delete reading"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} total)
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
