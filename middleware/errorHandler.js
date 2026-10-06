function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}

module.exports = errorHandler;
