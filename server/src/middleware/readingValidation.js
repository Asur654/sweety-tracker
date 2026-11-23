const { ALLOWED_SLOTS } = require('../models');

/**
 * Validates reading input fields based on Kenpath assessment requirements
 */
function validateReadingInput(req, res, next) {
  const { date, slot, value } = req.body;

  // 1. Value is required
  if (value === undefined || value === null || value === '') {
    return res.status(400).json({
      error: 'Please enter a glucose value.'
    });
  }

  // 2. Value must be a whole number between 40 and 600
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 40 || numericValue > 600) {
    return res.status(400).json({
      error: 'Value must be between 40 and 600 mg/dl.'
    });
  }

  // 3. Date is required
  if (!date || typeof date !== 'string') {
    return res.status(400).json({
      error: 'Date is required.'
    });
  }

  // 4. Date cannot be in the future
  const today = new Date().toISOString().split('T')[0];
  if (date > today) {
    return res.status(400).json({
      error: 'Date cannot be in the future.'
    });
  }

  // 5. Slot must be one of the allowed 4 slots
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return res.status(400).json({
      error: `Time slot must be one of: ${ALLOWED_SLOTS.join(', ')}`
    });
  }

  // Attach parsed numeric value to req
  req.parsedValue = numericValue;
  next();
}

module.exports = { validateReadingInput };
