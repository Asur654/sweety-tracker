import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, reading, loading }) {
  if (!isOpen || !reading) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center">Delete Reading?</h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          Are you sure you want to delete the reading for{' '}
          <strong className="text-slate-700">{reading.slot}</strong> on{' '}
          <strong className="text-slate-700">{reading.date}</strong> ({reading.value} mg/dl)?
          This action cannot be undone.
        </p>

        <div className="mt-6 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-1/2 py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center space-x-1"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
