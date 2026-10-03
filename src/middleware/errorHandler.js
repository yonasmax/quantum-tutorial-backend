exports.errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `Duplicate value for ${field}` });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Server Error'
  });
};