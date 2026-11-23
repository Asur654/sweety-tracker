const express = require('express');
const router = express.Router();
const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} = require('../controllers/readingController');
const { protect } = require('../middleware/auth');
const { validateReadingInput } = require('../middleware/readingValidation');

// All reading routes are protected
router.use(protect);

router.route('/')
  .post(validateReadingInput, createReading)
  .get(getReadings);

router.route('/:id')
  .get(getReadingById)
  .put(validateReadingInput, updateReading)
  .delete(deleteReading);

module.exports = router;
