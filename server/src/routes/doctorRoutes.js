const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireDoctor } = require('../middleware/doctorAuth');
const {
  getAssignedPatients,
  assignPatient,
  getPatientReports,
  getPatientReadings
} = require('../controllers/doctorController');

// All doctor routes require JWT authentication and doctor role
router.use(protect);
router.use(requireDoctor);

router.get('/patients', getAssignedPatients);
router.post('/patients/assign', assignPatient);
router.get('/patients/:patientId/reports/summary', getPatientReports);
router.get('/patients/:patientId/readings', getPatientReadings);

module.exports = router;
