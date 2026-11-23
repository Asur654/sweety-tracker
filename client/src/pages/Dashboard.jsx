import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SlotSummaryCards } from '../components/SlotSummaryCards';
import { ReadingsTable } from '../components/ReadingsTable';
import { ReadingModal } from '../components/ReadingModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Plus, Calendar, Filter, CheckCircle2, RefreshCw } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  // State
  const [todayReadings, setTodayReadings] = useState([]);
  const [allReadings, setAllReadings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [defaultSlot, setDefaultSlot] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Show auto-dismiss toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Fetch readings for today (to display slot completion status)
  const fetchTodayReadings = useCallback(async () => {
    try {
      const res = await api.get(`/readings?date=${todayStr}&limit=10`);
      setTodayReadings(res.data.readings || []);
    } catch (err) {
      console.error('Failed to load today readings:', err);
    }
  }, [todayStr]);

  // Fetch paginated readings history
  const fetchReadings = useCallback(async (page = 1, dateFilter = filterDate) => {
    setLoading(true);
    try {
      let url = `/readings?page=${page}&limit=10`;
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }
      const res = await api.get(url);
      setAllReadings(res.data.readings || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load readings history:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchTodayReadings();
    fetchReadings(1, filterDate);
  }, [fetchTodayReadings, fetchReadings, filterDate]);

  // Handlers
  const handleOpenAdd = (slotName = null) => {
    setEditingReading(null);
    setDefaultSlot(slotName);
    setModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setDefaultSlot(null);
    setModalOpen(true);
  };

  const handleOpenDelete = (reading) => {
    setReadingToDelete(reading);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!readingToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/readings/${readingToDelete.id}`);
      triggerToast('Reading deleted successfully.');
      setDeleteModalOpen(false);
      setReadingToDelete(null);
      fetchTodayReadings();
      fetchReadings(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete reading.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReadingSaved = (message) => {
    triggerToast(message);
    fetchTodayReadings();
    fetchReadings(pagination.page);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Hello, {user?.name}!</h1>
          <p className="text-sm text-emerald-100 mt-1 max-w-xl">
            Track your blood glucose daily across 4 standard slots. Maximum 4 readings allowed per day.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-sm shadow-sm hover:bg-emerald-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {/* Today's 4 Slots Completion Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Today's Log ({todayReadings.length} / 4 Slots Recorded)
          </h2>
          {todayReadings.length >= 4 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              All Slots Recorded
            </span>
          )}
        </div>
        <SlotSummaryCards
          todayReadings={todayReadings}
          onAddSlot={(slot) => handleOpenAdd(slot)}
          onEditReading={(reading) => handleOpenEdit(reading)}
        />
      </div>

      {/* Readings History Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Readings History</h2>
            <p className="text-xs text-slate-500">View, edit, or remove past glucose records</p>
          </div>

          {/* Date Filter & Clear */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-3 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
              >
                Clear Filter
              </button>
            )}
            <button
              onClick={() => {
                fetchTodayReadings();
                fetchReadings(pagination.page);
              }}
              title="Refresh"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <ReadingsTable
          readings={allReadings}
          pagination={pagination}
          onPageChange={(p) => fetchReadings(p)}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          loading={loading}
        />
      </div>

      {/* Add / Edit Modal */}
      <ReadingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleReadingSaved}
        initialData={editingReading}
        defaultSlot={defaultSlot}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        reading={readingToDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
