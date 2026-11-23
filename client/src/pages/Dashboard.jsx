import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Plus, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{today}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Hello, {user?.name}!</h1>
          <p className="text-sm text-emerald-100 mt-1 max-w-xl">
            Welcome to your blood glucose tracker. Record up to 4 readings per day across key meal slots.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            id="quick-add-btn"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-semibold text-sm shadow-sm hover:bg-emerald-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {/* Daily Slots Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { slot: 'Morning (fasting)', desc: 'Before breakfast' },
          { slot: 'After breakfast', desc: '1-2 hrs post-meal' },
          { slot: 'After lunch', desc: '1-2 hrs post-lunch' },
          { slot: 'After dinner', desc: '1-2 hrs post-dinner' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Slot {idx + 1}
                </span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mt-2">{item.slot}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Status</span>
              <span className="font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Pending
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Chunk 7 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Readings Management Ready</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Authentication and App Shell are operational. In Chunk 7, the Add Reading Modal, CRUD table, and live validation will be wired up.
        </p>
      </div>
    </div>
  );
}
