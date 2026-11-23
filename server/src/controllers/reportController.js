const { Reading } = require('../models');
const { Op } = require('sequelize');
const {
  formatDate,
  getMonthToDateRange,
  getPreviousMonthRange,
  calculateStats
} = require('../utils/dateHelpers');

/**
 * Standard slot order for chronological sorting within daily report
 */
const SLOT_ORDER = {
  'Morning (fasting)': 1,
  'After breakfast': 2,
  'After lunch': 3,
  'After dinner': 4
};

/**
 * Daily Report:
 * The selected date. Shows highest, lowest, average (1 decimal), count,
 * and lists each reading with its slot.
 * GET /api/reports/daily?date=YYYY-MM-DD
 */
async function getDailyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || formatDate(new Date());

    const readings = await Reading.findAll({
      where: {
        userId,
        date: selectedDate
      }
    });

    // Sort readings by chronological slot order
    readings.sort((a, b) => {
      const orderA = SLOT_ORDER[a.slot] || 99;
      const orderB = SLOT_ORDER[b.slot] || 99;
      return orderA - orderB;
    });

    const stats = calculateStats(readings);

    return res.status(200).json({
      type: 'daily',
      date: selectedDate,
      ...stats,
      readings: readings.map(r => ({
        id: r.id,
        date: r.date,
        slot: r.slot,
        value: r.value,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Month-to-date Report:
 * 1st of the month to the selected date.
 * GET /api/reports/month-to-date?date=YYYY-MM-DD
 */
async function getMonthToDateReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || formatDate(new Date());
    const { startDate, endDate } = getMonthToDateRange(selectedDate);

    const readings = await Reading.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [
        ['date', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });

    const stats = calculateStats(readings);

    return res.status(200).json({
      type: 'month-to-date',
      selectedDate,
      startDate,
      endDate,
      ...stats,
      readings: readings.map(r => ({
        id: r.id,
        date: r.date,
        slot: r.slot,
        value: r.value
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Monthly Report:
 * The whole previous month.
 * GET /api/reports/monthly?date=YYYY-MM-DD
 */
async function getMonthlyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || formatDate(new Date());
    const { startDate, endDate, year, month } = getPreviousMonthRange(selectedDate);

    const readings = await Reading.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [
        ['date', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });

    const stats = calculateStats(readings);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const previousMonthLabel = `${monthNames[month - 1]} ${year}`;

    return res.status(200).json({
      type: 'monthly',
      selectedDate,
      startDate,
      endDate,
      periodLabel: previousMonthLabel,
      ...stats,
      readings: readings.map(r => ({
        id: r.id,
        date: r.date,
        slot: r.slot,
        value: r.value
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Combined Reports Summary:
 * Returns Daily, Month-to-date, and Monthly reports in a single query
 * GET /api/reports/summary?date=YYYY-MM-DD
 */
async function getReportsSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || formatDate(new Date());

    const mtdRange = getMonthToDateRange(selectedDate);
    const prevMonthRange = getPreviousMonthRange(selectedDate);

    // Fetch earliest start date to cover both previous month and month to date in one DB query
    const earliestStart = prevMonthRange.startDate;
    const latestEnd = selectedDate;

    const allReadings = await Reading.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [earliestStart, latestEnd]
        }
      },
      order: [['date', 'ASC']]
    });

    // 1. Daily readings
    const dailyReadings = allReadings.filter(r => r.date === selectedDate);
    dailyReadings.sort((a, b) => (SLOT_ORDER[a.slot] || 99) - (SLOT_ORDER[b.slot] || 99));

    // 2. Month-to-date readings
    const mtdReadings = allReadings.filter(
      r => r.date >= mtdRange.startDate && r.date <= mtdRange.endDate
    );

    // 3. Previous month readings
    const prevMonthReadings = allReadings.filter(
      r => r.date >= prevMonthRange.startDate && r.date <= prevMonthRange.endDate
    );

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const previousMonthLabel = `${monthNames[prevMonthRange.month - 1]} ${prevMonthRange.year}`;

    return res.status(200).json({
      selectedDate,
      daily: {
        date: selectedDate,
        ...calculateStats(dailyReadings),
        readings: dailyReadings
      },
      monthToDate: {
        startDate: mtdRange.startDate,
        endDate: mtdRange.endDate,
        ...calculateStats(mtdReadings),
        readings: mtdReadings
      },
      monthly: {
        startDate: prevMonthRange.startDate,
        endDate: prevMonthRange.endDate,
        periodLabel: previousMonthLabel,
        ...calculateStats(prevMonthReadings),
        readings: prevMonthReadings
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
  getReportsSummary
};
