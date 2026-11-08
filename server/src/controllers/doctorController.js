const { query } = require('../config/db');
const { calculateReportDateRanges } = require('./reportsController');

/**
 * List patients assigned to the logged-in doctor
 * GET /api/doctor/patients
 */
async function getAssignedPatients(req, res, next) {
  try {
    const doctorId = req.user.id;

    const result = await query(
      `SELECT 
         u.id, 
         u.name, 
         u.email,
         dp.assigned_at,
         (SELECT COUNT(*)::int FROM readings r WHERE r.user_id = u.id) AS total_readings,
         (SELECT TO_CHAR(MAX(reading_date), 'YYYY-MM-DD') FROM readings r WHERE r.user_id = u.id) AS last_reading_date
       FROM users u
       JOIN doctor_patients dp ON dp.patient_id = u.id
       WHERE dp.doctor_id = $1
       ORDER BY u.name ASC`,
      [doctorId]
    );

    return res.json({
      success: true,
      patients: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get reports for a specific assigned patient
 * GET /api/doctor/patients/:patientId/reports?date=YYYY-MM-DD
 */
async function getPatientReports(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    let selectedDate = req.query.date || new Date().toISOString().split('T')[0];

    // 1. Verify doctor-patient assignment
    const assignmentCheck = await query(
      'SELECT u.id, u.name, u.email FROM users u JOIN doctor_patients dp ON dp.patient_id = u.id WHERE dp.doctor_id = $1 AND dp.patient_id = $2',
      [doctorId, patientId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This patient is not assigned to you.'
      });
    }

    const patient = assignmentCheck.rows[0];
    const ranges = calculateReportDateRanges(selectedDate);

    // 2. Fetch stats for patient
    const getStats = async (start, end) => {
      const statRes = await query(
        `SELECT
           COUNT(*)::int AS count,
           MAX(value)::int AS highest,
           MIN(value)::int AS lowest,
           ROUND(AVG(value)::numeric, 1)::float AS average
         FROM readings
         WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
        [patientId, start, end]
      );
      const row = statRes.rows[0];
      const count = row.count || 0;
      if (count === 0) {
        return { count: 0, highest: null, lowest: null, average: null, hasReadings: false };
      }
      return {
        count,
        highest: row.highest,
        lowest: row.lowest,
        average: parseFloat(row.average.toFixed(1)),
        hasReadings: true
      };
    };

    const [dailyStats, mtdStats, prevMonthStats, dailyReadings, trends] = await Promise.all([
      getStats(ranges.daily.startDate, ranges.daily.endDate),
      getStats(ranges.monthToDate.startDate, ranges.monthToDate.endDate),
      getStats(ranges.previousMonth.startDate, ranges.previousMonth.endDate),
      query(
        `SELECT id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at
         FROM readings
         WHERE user_id = $1 AND reading_date = $2
         ORDER BY
           CASE slot
             WHEN 'Morning (fasting)' THEN 1
             WHEN 'After breakfast' THEN 2
             WHEN 'After lunch' THEN 3
             WHEN 'After dinner' THEN 4
             ELSE 5
           END ASC`,
        [patientId, selectedDate]
      ),
      query(
        `SELECT TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value
         FROM readings
         WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
         ORDER BY reading_date ASC,
           CASE slot
             WHEN 'Morning (fasting)' THEN 1
             WHEN 'After breakfast' THEN 2
             WHEN 'After lunch' THEN 3
             WHEN 'After dinner' THEN 4
             ELSE 5
           END ASC`,
        [patientId, ranges.monthToDate.startDate, ranges.monthToDate.endDate]
      )
    ]);

    return res.json({
      success: true,
      patient,
      selectedDate,
      reports: {
        daily: { ...ranges.daily, ...dailyStats, readings: dailyReadings.rows },
        monthToDate: { ...ranges.monthToDate, ...mtdStats },
        previousMonth: { ...ranges.previousMonth, ...prevMonthStats }
      },
      trends: trends.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssignedPatients,
  getPatientReports
};
