/**
 * Utility functions for date parsing, date ranges and statistical calculations
 */

/**
 * Format Date object to YYYY-MM-DD string
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into UTC date components
 */
function parseDateParts(dateStr) {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10), // 1-indexed (1 = Jan, 12 = Dec)
    day: parseInt(parts[2], 10)
  };
}

/**
 * Get Month-to-date range:
 * 1st of the current month to the selected date
 * e.g., '2026-10-15' -> { startDate: '2026-10-01', endDate: '2026-10-15' }
 */
function getMonthToDateRange(selectedDateStr) {
  const { year, month } = parseDateParts(selectedDateStr);
  const formattedMonth = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${formattedMonth}-01`,
    endDate: selectedDateStr
  };
}

/**
 * Get Previous Month range:
 * The whole previous month
 * e.g., '2026-10-15' -> { startDate: '2026-09-01', endDate: '2026-09-30' }
 * e.g., '2026-01-15' -> { startDate: '2025-12-01', endDate: '2025-12-31' }
 */
function getPreviousMonthRange(selectedDateStr) {
  const { year, month } = parseDateParts(selectedDateStr);

  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const formattedMonth = String(prevMonth).padStart(2, '0');
  // Day 0 of the next month returns the last day of prevMonth
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const formattedLastDay = String(lastDay).padStart(2, '0');

  return {
    startDate: `${prevYear}-${formattedMonth}-01`,
    endDate: `${prevYear}-${formattedMonth}-${formattedLastDay}`,
    year: prevYear,
    month: prevMonth
  };
}

/**
 * Calculate statistical summary:
 * highest, lowest, average (rounded to 1 decimal), count, and empty state
 */
function calculateStats(readings) {
  if (!readings || readings.length === 0) {
    return {
      highest: null,
      lowest: null,
      average: null,
      count: 0,
      isEmpty: true,
      message: 'No readings found for this period.'
    };
  }

  const values = readings.map(r => r.value);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  const average = Number((sum / values.length).toFixed(1));

  return {
    highest,
    lowest,
    average,
    count: values.length,
    isEmpty: false
  };
}

module.exports = {
  formatDate,
  parseDateParts,
  getMonthToDateRange,
  getPreviousMonthRange,
  calculateStats
};
