const { query } = require('../config/db');
const { validateReadingInput, getSlotArticle } = require('../utils/validation');
const { invalidateUserReportsCache } = require('../config/redis');

/**
 * Format reading date to YYYY-MM-DD string to avoid timezone shifts
 */
function formatDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0];
  }
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add a new reading
 * POST /api/readings
 */
async function createReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { reading_date, slot, value } = req.body;

    // 1. Structural & range validations
    const validationError = validateReadingInput({ reading_date, slot, value });
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // 2. Query existing readings for this user on this date
    const existingReadings = await query(
      'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, reading_date]
    );

    // Rule: Maximum 4 readings per day
    if (existingReadings.rows.length >= 4) {
      return res.status(400).json({
        success: false,
        error: 'You can add only 4 readings per day.'
      });
    }

    // Rule: Only one reading per slot per day
    const slotConflict = existingReadings.rows.find((r) => r.slot === slot);
    if (slotConflict) {
      const article = getSlotArticle(slot);
      return res.status(400).json({
        success: false,
        error: `You already have ${article} ${slot} reading for this date.`
      });
    }

    // 3. Insert reading
    const insertResult = await query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at`,
      [userId, reading_date, slot, parseInt(value, 10)]
    );

    // Invalidate Redis cache when readings change
    await invalidateUserReportsCache(userId);

    return res.status(201).json({
      success: true,
      message: 'Reading logged successfully.',
      reading: insertResult.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      const slot = req.body.slot || 'selected';
      const article = getSlotArticle(slot);
      return res.status(400).json({
        success: false,
        error: `You already have ${article} ${slot} reading for this date.`
      });
    }
    next(err);
  }
}

/**
 * Get readings for the authenticated user
 * GET /api/readings?page=1&limit=20&date=YYYY-MM-DD
 */
async function getReadings(req, res, next) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const { date, startDate, endDate } = req.query;

    const whereClauses = ['user_id = $1'];
    const params = [userId];

    if (date) {
      params.push(date);
      whereClauses.push(`reading_date = $${params.length}`);
    } else {
      if (startDate) {
        params.push(startDate);
        whereClauses.push(`reading_date >= $${params.length}`);
      }
      if (endDate) {
        params.push(endDate);
        whereClauses.push(`reading_date <= $${params.length}`);
      }
    }

    const whereStr = whereClauses.join(' AND ');

    // Total count for pagination
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM readings WHERE ${whereStr}`,
      params
    );
    const total = countResult.rows[0]?.total || 0;

    // Readings query
    const readingsQuery = `
      SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at
      FROM readings
      WHERE ${whereStr}
      ORDER BY reading_date DESC,
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC,
        id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const readingsResult = await query(readingsQuery, [...params, limit, offset]);

    return res.json({
      success: true,
      readings: readingsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single reading by ID
 * GET /api/readings/:id
 */
async function getReadingById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reading not found.' });
    }

    return res.json({
      success: true,
      reading: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing reading
 * PUT /api/readings/:id
 */
async function updateReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reading_date, slot, value } = req.body;

    // Check reading existence & ownership
    const existing = await query(
      'SELECT id, reading_date, slot FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reading not found.' });
    }

    // Structural & range validation
    const validationError = validateReadingInput({ reading_date, slot, value });
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // Check slot collision on the target date (excluding this reading itself)
    const slotCheck = await query(
      `SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id != $4`,
      [userId, reading_date, slot, id]
    );

    if (slotCheck.rows.length > 0) {
      const article = getSlotArticle(slot);
      return res.status(400).json({
        success: false,
        error: `You already have ${article} ${slot} reading for this date.`
      });
    }

    const updateResult = await query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at`,
      [reading_date, slot, parseInt(value, 10), id, userId]
    );

    // Invalidate Redis cache when readings change
    await invalidateUserReportsCache(userId);

    return res.json({
      success: true,
      message: 'Reading updated successfully.',
      reading: updateResult.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      const slot = req.body.slot || 'selected';
      const article = getSlotArticle(slot);
      return res.status(400).json({
        success: false,
        error: `You already have ${article} ${slot} reading for this date.`
      });
    }
    next(err);
  }
}

/**
 * Delete a reading
 * DELETE /api/readings/:id
 */
async function deleteReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reading not found.' });
    }

    // Invalidate Redis cache when readings change
    await invalidateUserReportsCache(userId);

    return res.json({
      success: true,
      message: 'Reading deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
};
