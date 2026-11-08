const express = require('express');
const { getAssignedPatients, getPatientReports } = require('../controllers/doctorController');
const { authMiddleware, doctorMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(doctorMiddleware);

router.get('/patients', getAssignedPatients);
router.get('/patients/:patientId/reports', getPatientReports);

module.exports = router;
