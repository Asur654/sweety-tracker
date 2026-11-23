const { User, Reading, DoctorPatient } = require('../models');
const { Op } = require('sequelize');
const {
  formatDate,
  getMonthToDateRange,
  getPreviousMonthRange,
  calculateStats
} = require('../utils/dateHelpers');

const SLOT_ORDER = {
  'Morning (fasting)': 1,
  'After breakfast': 2,
  'After lunch': 3,
  'After dinner': 4
};

/**
 * Get all patients assigned to the authenticated doctor
 * GET /api/doctor/patients
 */
async function getAssignedPatients(req, res, next) {
  try {
    const doctorId = req.user.id;

    const assignments = await DoctorPatient.findAll({
      where: { doctorId },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const patients = assignments.map(a => a.patient).filter(Boolean);

    // Fetch latest reading for each patient
    const patientCards = await Promise.all(
      patients.map(async (patient) => {
        const latestReading = await Reading.findOne({
          where: { userId: patient.id },
          order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });

        const totalReadings = await Reading.count({
          where: { userId: patient.id }
        });

        return {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          totalReadings,
          latestReading: latestReading
            ? {
                date: latestReading.date,
                slot: latestReading.slot,
                value: latestReading.value
              }
            : null
        };
      })
    );

    return res.status(200).json({ patients: patientCards });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign a patient to this doctor by patient email
 * POST /api/doctor/patients/assign
 * Body: { patientEmail: '...' }
 */
async function assignPatient(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientEmail } = req.body;

    if (!patientEmail) {
      return res.status(400).json({ error: 'Patient email is required.' });
    }

    const patient = await User.findOne({
      where: { email: patientEmail.trim().toLowerCase() }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient with this email does not exist.' });
    }

    if (patient.id === doctorId) {
      return res.status(400).json({ error: 'A doctor cannot assign themselves as their own patient.' });
    }

    // Check existing assignment
    const existing = await DoctorPatient.findOne({
      where: { doctorId, patientId: patient.id }
    });

    if (existing) {
      return res.status(400).json({ error: 'Patient is already assigned to your care list.' });
    }

    await DoctorPatient.create({
      doctorId,
      patientId: patient.id
    });

    return res.status(201).json({
      message: `Patient ${patient.name} (${patient.email}) assigned successfully.`,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to verify doctor-patient assignment
 */
async function verifyAssignment(doctorId, patientId) {
  const assignment = await DoctorPatient.findOne({
    where: { doctorId, patientId }
  });
  return !!assignment;
}

/**
 * View an assigned patient's full report summary
 * GET /api/doctor/patients/:patientId/reports/summary?date=YYYY-MM-DD
 */
async function getPatientReports(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const selectedDate = req.query.date || formatDate(new Date());

    const isAssigned = await verifyAssignment(doctorId, patientId);
    if (!isAssigned) {
      return res.status(403).json({
        error: 'Access denied: This patient is not assigned to you.'
      });
    }

    const patient = await User.findByPk(patientId, {
      attributes: ['id', 'name', 'email']
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const mtdRange = getMonthToDateRange(selectedDate);
    const prevMonthRange = getPreviousMonthRange(selectedDate);

    const earliestStart = prevMonthRange.startDate;
    const latestEnd = selectedDate;

    const allReadings = await Reading.findAll({
      where: {
        userId: patientId,
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
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      },
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

/**
 * View an assigned patient's readings history
 * GET /api/doctor/patients/:patientId/readings?page=1&limit=20
 */
async function getPatientReadings(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const isAssigned = await verifyAssignment(doctorId, patientId);
    if (!isAssigned) {
      return res.status(403).json({
        error: 'Access denied: This patient is not assigned to you.'
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Reading.findAndCountAll({
      where: { userId: patientId },
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

module.exports = {
  getAssignedPatients,
  assignPatient,
  getPatientReports,
  getPatientReadings
};
