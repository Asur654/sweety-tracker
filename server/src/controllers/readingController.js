const { Reading, ALLOWED_SLOTS } = require('../models');
const { Op } = require('sequelize');

/**
 * Format dynamic article for slot error message:
 * e.g. "an After lunch reading" vs "a Morning (fasting) reading"
 */
function getArticle(slotName) {
  const firstLetter = slotName.trim()[0].toUpperCase();
  return ['A', 'E', 'I', 'O', 'U'].includes(firstLetter) ? 'an' : 'a';
}

/**
 * Create a new blood glucose reading
 * POST /api/readings
 */
async function createReading(req, res, next) {
  try {
    const { date, slot } = req.body;
    const value = req.parsedValue;
    const userId = req.user.id;

    // Fetch existing readings for this user on the selected date
    const existingReadings = await Reading.findAll({
      where: { userId, date }
    });

    // Rule: Maximum 4 readings per day
    if (existingReadings.length >= 4) {
      return res.status(400).json({
        error: 'You can add only 4 readings per day.'
      });
    }

    // Rule: Only one reading per slot per day
    const duplicateSlot = existingReadings.find(r => r.slot === slot);
    if (duplicateSlot) {
      const article = getArticle(slot);
      return res.status(400).json({
        error: `You already have ${article} ${slot} reading for this date.`
      });
    }

    // Create the reading
    const reading = await Reading.create({
      userId,
      date,
      slot,
      value
    });

    return res.status(201).json({
      message: 'Reading recorded successfully',
      reading
    });
  } catch (error) {
    // Handle database unique constraint as a safeguard
    if (error.name === 'SequelizeUniqueConstraintError') {
      const article = getArticle(req.body.slot || 'slot');
      return res.status(400).json({
        error: `You already have ${article} ${req.body.slot} reading for this date.`
      });
    }
    next(error);
  }
}

/**
 * Get all readings for the authenticated user (supports pagination & filtering)
 * GET /api/readings?page=1&limit=20&date=YYYY-MM-DD&startDate=...&endDate=...
 */
async function getReadings(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, date, startDate, endDate, slot } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Build filter criteria scoped strictly to the current user
    const where = { userId };

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    if (slot && ALLOWED_SLOTS.includes(slot)) {
      where.slot = slot;
    }

    const { count, rows } = await Reading.findAndCountAll({
      where,
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: limitNum,
      offset
    });

    return res.status(200).json({
      readings: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single reading by ID
 * GET /api/readings/:id
 */
async function getReadingById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reading = await Reading.findOne({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({
        error: 'Reading not found'
      });
    }

    return res.status(200).json({ reading });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing reading
 * PUT /api/readings/:id
 */
async function updateReading(req, res, next) {
  try {
    const { id } = req.params;
    const { date, slot } = req.body;
    const value = req.parsedValue;
    const userId = req.user.id;

    const reading = await Reading.findOne({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({
        error: 'Reading not found'
      });
    }

    // Check if updating date/slot conflicts with another reading of the same user
    if (reading.date !== date || reading.slot !== slot) {
      const existingConflict = await Reading.findOne({
        where: {
          userId,
          date,
          slot,
          id: { [Op.ne]: id }
        }
      });

      if (existingConflict) {
        const article = getArticle(slot);
        return res.status(400).json({
          error: `You already have ${article} ${slot} reading for this date.`
        });
      }

      // Check daily limit if date is changing
      if (reading.date !== date) {
        const countOnNewDate = await Reading.count({
          where: { userId, date }
        });
        if (countOnNewDate >= 4) {
          return res.status(400).json({
            error: 'You can add only 4 readings per day.'
          });
        }
      }
    }

    reading.date = date;
    reading.slot = slot;
    reading.value = value;
    await reading.save();

    return res.status(200).json({
      message: 'Reading updated successfully',
      reading
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a reading
 * DELETE /api/readings/:id
 */
async function deleteReading(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reading = await Reading.findOne({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({
        error: 'Reading not found'
      });
    }

    await reading.destroy();

    return res.status(200).json({
      message: 'Reading deleted successfully',
      id
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
};
