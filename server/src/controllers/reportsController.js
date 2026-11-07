const { query } = require('../config/db');

/**
 * Calculates start and end date ranges for:
 * 1. Daily (selected date)
 * 2. Month-to-date (1st of selected date's month to selected date)
 * 3. Monthly (whole previous month: 1st of prev month to last day of prev month)
 */
function calculateReportDateRanges(selectedDateStr) {
  // Parse year, month (1-indexed), day
  const [yearStr, monthStr, dayStr] = selectedDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  // Pad helper
  const pad = (n) => String(n).padStart(2, '0');

  // Daily
  const dailyStart = selectedDateStr;
  const dailyEnd = selectedDateStr;

  // Month-to-date: 1st of current month to selected date
  const mtdStart = `${year}-${pad(month)}-01`;
  const mtdEnd = selectedDateStr;

  // Monthly: Whole previous month
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  // Last day of previous month: day 0 of month (where month is 1-indexed next)
  const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const prevMonthStart = `${prevYear}-${pad(prevMonth)}-01`;
  const prevMonthEnd = `${prevYear}-${pad(prevMonth)}-${pad(lastDayOfPrevMonth)}`;

  return {
    daily: {
      startDate: dailyStart,
      endDate: dailyEnd,
      label: `Daily (${selectedDateStr})`
    },
    monthToDate: {
      startDate: mtdStart,
      endDate: mtdEnd,
      label: `Month-to-date (${mtdStart} – ${mtdEnd})`
    },
    previousMonth: {
      startDate: prevMonthStart,
      endDate: prevMonthEnd,
      label: `Monthly (Previous Month: ${prevMonthStart} – ${prevMonthEnd})`
    }
  };
}

/**
 * Helper to fetch aggregated stats for a date range
 */
async function getStatsForRange(userId, startDate, endDate) {
  const result = await query(
    `SELECT
       COUNT(*)::int AS count,
       MAX(value)::int AS highest,
       MIN(value)::int AS lowest,
       ROUND(AVG(value)::numeric, 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
    [userId, startDate, endDate]
  );

  const row = result.rows[0];
  const count = row.count || 0;

  if (count === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      hasReadings: false
    };
  }

  return {
    count,
    highest: row.highest,
    lowest: row.lowest,
    average: parseFloat(row.average.toFixed(1)),
    hasReadings: true
  };
}

/**
 * Get comprehensive reports for selected date
 * GET /api/reports?date=YYYY-MM-DD
 */
async function getReports(req, res, next) {
  try {
    const userId = req.user.id;
    let selectedDate = req.query.date;

    if (!selectedDate) {
      selectedDate = new Date().toISOString().split('T')[0];
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid date in YYYY-MM-DD format.'
      });
    }

    const ranges = calculateReportDateRanges(selectedDate);

    // 1. Daily Report & readings
    const [dailyStats, mtdStats, prevMonthStats, dailyReadingsResult, monthlyTrendsResult] = await Promise.all([
      getStatsForRange(userId, ranges.daily.startDate, ranges.daily.endDate),
      getStatsForRange(userId, ranges.monthToDate.startDate, ranges.monthToDate.endDate),
      getStatsForRange(userId, ranges.previousMonth.startDate, ranges.previousMonth.endDate),
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
        [userId, selectedDate]
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
        [userId, ranges.monthToDate.startDate, ranges.monthToDate.endDate]
      )
    ]);

    return res.json({
      success: true,
      selectedDate,
      reports: {
        daily: {
          ...ranges.daily,
          ...dailyStats,
          readings: dailyReadingsResult.rows
        },
        monthToDate: {
          ...ranges.monthToDate,
          ...mtdStats
        },
        previousMonth: {
          ...ranges.previousMonth,
          ...prevMonthStats
        }
      },
      trends: monthlyTrendsResult.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReports,
  calculateReportDateRanges
};
