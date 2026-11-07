const express = require('express');
const { getReports } = require('../controllers/reportsController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getReports);

module.exports = router;
