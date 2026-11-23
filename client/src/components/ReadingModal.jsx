import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Activity, Check } from 'lucide-react';
import api from '../services/api';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export function ReadingModal({ isOpen, onClose, onSaved, initialData = null, defaultSlot = null }) {
  const isEditing = !!initialData;
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setSlot(initialData.slot);
        setValue(String(initialData.value));
      } else {
        setDate(todayStr);
        setSlot(defaultSlot || SLOTS[0]);
        setValue('');
      }
      setError('');
    }
  }, [isOpen, initialData, defaultSlot, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations adhering to Kenpath requirements:
    if (value === '' || value === null || value === undefined) {
      setError('Please enter a glucose value.');
      return;
    }

    const numValue = Number(value);
    if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    if (date > todayStr) {
      setError('Date cannot be in the future.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/readings/${initialData.id}`, {
          date,
          slot,
          value: numValue
        });
      } else {
        await api.post('/readings', {
          date,
          slot,
          value: numValue
        });
      }
      onSaved(isEditing ? 'Reading updated successfully.' : 'Reading recorded successfully.');
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error || 'An error occurred while saving the reading.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEditing ? 'Edit Glucose Reading' : 'Log Blood Glucose'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start space-x-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reading Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                max={todayStr}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${
                    slot === s
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{s}</span>
                  {slot === s && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Glucose Value Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Glucose Value (mg/dl)
              </label>
              <span className="text-[11px] text-slate-400">Allowed: 40 – 600</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="600"
                step="1"
                required
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 font-medium pointer-events-none">
                mg/dl
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Fasting target: 70–99 mg/dl • Post-meal target: &lt; 140 mg/dl
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Record Reading'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
