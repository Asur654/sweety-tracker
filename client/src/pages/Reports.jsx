import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ReportStatCards } from '../components/ReportStatCards';
import { GlucoseChart } from '../components/GlucoseChart';
import { Calendar, BarChart3, Clock, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Reports() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'month-to-date' | 'monthly'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch full summary report (daily, month-to-date, monthly)
  const fetchReports = useCallback(async (dateToFetch = selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/summary?date=${dateToFetch}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load glucose reports. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports(selectedDate);
  }, [fetchReports, selectedDate]);

  const currentReport = reportData ? reportData[activeTab === 'month-to-date' ? 'monthToDate' : activeTab] : null;

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review glucose metrics: highest, lowest, average (rounded to 1 decimal), and reading counts
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-sm"
            />
          </div>
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => fetchReports(selectedDate)}
            title="Refresh reports"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Navigation Tabs */}
      <div className="border-b border-slate-200 flex space-x-2 sm:space-x-6">
        {[
          { id: 'daily', label: 'Daily Report', subtitle: selectedDate },
          {
            id: 'month-to-date',
            label: 'Month-to-Date',
            subtitle: reportData?.monthToDate
              ? `${reportData.monthToDate.startDate} to ${reportData.monthToDate.endDate}`
              : '1st of month to date'
          },
          {
            id: 'monthly',
            label: 'Monthly (Previous Month)',
            subtitle: reportData?.monthly?.periodLabel || 'Whole previous month'
          }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 pt-1 text-sm font-semibold border-b-2 transition-all flex flex-col items-start ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[11px] font-normal text-slate-400 mt-0.5">{tab.subtitle}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Calculating reports...</p>
        </div>
      ) : currentReport ? (
        <div className="space-y-6">
          {/* 4 Stat Cards */}
          <ReportStatCards stats={currentReport} />

          {/* If Empty State */}
          {currentReport.isEmpty ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Readings For This Period</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are no recorded blood glucose measurements in this date range. Record readings from your dashboard to view complete statistics and charts.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <span>Go to Readings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Daily Report Slot Breakdown (Required by Kenpath: Daily report lists each reading with its slot) */}
              {activeTab === 'daily' && currentReport.readings && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        Daily Slot Breakdown for {currentReport.date}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Detailed glucose measurements recorded for each meal slot
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      {currentReport.readings.length} / 4 Slots Recorded
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {currentReport.readings.map((r) => (
                      <div
                        key={r.id || r.slot}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{r.slot}</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="mt-3 flex items-baseline space-x-1">
                          <span className="text-2xl font-bold text-slate-900">{r.value}</span>
                          <span className="text-xs font-medium text-slate-400">mg/dl</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend Chart (Bonus Task: Recharts line chart) */}
              <GlucoseChart
                readings={currentReport.readings || []}
                title={
                  activeTab === 'daily'
                    ? `Daily Fluctuation (${currentReport.date})`
                    : activeTab === 'month-to-date'
                    ? `Month-to-Date Trend (${currentReport.startDate} to ${currentReport.endDate})`
                    : `Previous Month Trend (${currentReport.periodLabel})`
                }
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
