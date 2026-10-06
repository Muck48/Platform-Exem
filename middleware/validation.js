function validateId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ success: false, error: 'Invalid ID format' });
    return;
  }

  req.params.id = id;
  next();
}

function validateItemInput(req, res, next) {
  const { name } = req.body || {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Missing required field: name' });
    return;
  }

  req.body.name = name.trim();
  next();
}

module.exports = {
  validateId,
  validateItemInput
};
