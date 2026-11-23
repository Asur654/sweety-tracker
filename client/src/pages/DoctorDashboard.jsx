import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ReportStatCards } from '../components/ReportStatCards';
import { GlucoseChart } from '../components/GlucoseChart';
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react';

export function DoctorDashboard() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState('daily');
  const [reportData, setReportData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch all patients assigned to this doctor
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctor/patients');
      const list = res.data.patients || [];
      setPatients(list);
      // Auto-select first patient if none selected
      if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError('Unable to load assigned patients list.');
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  // Fetch report summary for selected patient
  const fetchPatientReport = useCallback(async (patientId, date) => {
    if (!patientId) return;
    setReportLoading(true);
    try {
      const res = await api.get(`/doctor/patients/${patientId}/reports/summary?date=${date}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load patient report:', err);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientReport(selectedPatientId, selectedDate);
    }
  }, [selectedPatientId, selectedDate, fetchPatientReport]);

  const handleAssignPatient = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignLoading(true);
    try {
      const res = await api.post('/doctor/patients/assign', { patientEmail });
      triggerToast(res.data.message);
      setAssignModalOpen(false);
      setPatientEmail('');
      await fetchPatients();
      if (res.data.patient) {
        setSelectedPatientId(res.data.patient.id);
      }
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to assign patient.');
    } finally {
      setAssignLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const currentReport = reportData
    ? reportData[activeTab === 'month-to-date' ? 'monthToDate' : activeTab]
    : null;

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
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Physician Portal</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Doctor Care Dashboard</h1>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Monitor clinical glucose metrics, fluctuations, and reports for patients assigned to your care.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-blue-800 font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Patient</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Patients List Sidebar + Detailed Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Patients List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Assigned Patients ({patients.length})
            </h2>
            <button
              onClick={fetchPatients}
              title="Refresh patients"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No patients assigned to you yet.</p>
              <button
                onClick={() => setAssignModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Assign your first patient
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {patients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-sm truncate">{p.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{p.email}</p>
                      <div className="mt-2 flex items-center space-x-2 text-[11px]">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {p.totalReadings} records
                        </span>
                        {p.latestReading && (
                          <span className="text-slate-500 font-semibold">
                            Latest: {p.latestReading.value} mg/dl
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Patient Reports & Trends */}
        <div className="lg:col-span-8 space-y-5">
          {selectedPatient ? (
            <>
              {/* Patient Header & Date Selector */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Patient Profile
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">{selectedPatient.name}</h2>
                  <p className="text-xs text-slate-400">{selectedPatient.email}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    max={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  {selectedDate !== todayStr && (
                    <button
                      onClick={() => setSelectedDate(todayStr)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors"
                    >
                      Today
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200 flex space-x-4">
                {[
                  { id: 'daily', label: 'Daily Report', subtitle: selectedDate },
                  {
                    id: 'month-to-date',
                    label: 'Month-to-Date',
                    subtitle: reportData?.monthToDate
                      ? `${reportData.monthToDate.startDate} to ${reportData.monthToDate.endDate}`
                      : ''
                  },
                  {
                    id: 'monthly',
                    label: 'Monthly (Previous Month)',
                    subtitle: reportData?.monthly?.periodLabel || ''
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2.5 pt-1 text-xs sm:text-sm font-semibold border-b-2 transition-all flex flex-col items-start ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.subtitle && <span className="text-[10px] font-normal text-slate-400 mt-0.5">{tab.subtitle}</span>}
                  </button>
                ))}
              </div>

              {reportLoading ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading patient report...</div>
              ) : currentReport ? (
                <div className="space-y-6">
                  {/* 4 Stat Cards */}
                  <ReportStatCards stats={currentReport} />

                  {/* Empty state */}
                  {currentReport.isEmpty ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                      No glucose readings recorded by this patient for the chosen period.
                    </div>
                  ) : (
                    <>
                      {/* Daily Slot Breakdown */}
                      {activeTab === 'daily' && currentReport.readings && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Daily Readings for {currentReport.date}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {currentReport.readings.map((r) => (
                              <div key={r.id || r.slot} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-xs font-semibold text-slate-600">{r.slot}</span>
                                <div className="mt-2 flex items-baseline space-x-1">
                                  <span className="text-xl font-bold text-slate-900">{r.value}</span>
                                  <span className="text-xs text-slate-400">mg/dl</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chart */}
                      <GlucoseChart
                        readings={currentReport.readings || []}
                        title={`Glucose Trends for ${selectedPatient.name}`}
                      />
                    </>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Select an assigned patient from the list on the left to review their glucose reports.
            </div>
          )}
        </div>
      </div>

      {/* Assign Patient Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Assign Patient to Care List</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter the email address of a registered patient to add them to your monitoring dashboard.
            </p>

            {assignError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignPatient} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. demo@sweety.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="w-1/2 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="w-1/2 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
