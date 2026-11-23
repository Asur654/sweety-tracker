const express = require('express');
const router = express.Router();
const {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
  getReportsSummary
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// All report routes require authentication
router.use(protect);

router.get('/daily', getDailyReport);
router.get('/month-to-date', getMonthToDateReport);
router.get('/monthly', getMonthlyReport);
router.get('/summary', getReportsSummary);

module.exports = router;
