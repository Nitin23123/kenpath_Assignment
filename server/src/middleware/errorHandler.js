function errorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);

  // PostgreSQL unique violation error
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with this information already exists.'
    });
  }

  // PostgreSQL check violation error
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Constraint validation failed for this reading.'
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = { errorHandler };
