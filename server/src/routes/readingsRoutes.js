const express = require('express');
const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} = require('../controllers/readingsController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All readings routes require authentication
router.use(authMiddleware);

router.post('/', createReading);
router.get('/', getReadings);
router.get('/:id', getReadingById);
router.put('/:id', updateReading);
router.delete('/:id', deleteReading);

module.exports = router;
