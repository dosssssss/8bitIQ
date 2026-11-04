const { ApiError } = require('../utils/apiError');

// Every API error goes out as { success: false, message, ...details }.

function apiNotFound(req, res) {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, message: err.message, ...err.details });
  }

  // Errors from express.json() when the body can't be read.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body must be valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large' });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ success: false, message: 'Bad request' });
  }

  // Anything else is a bug. Log it, but don't send internal details to the page.
  console.error(err);
  return res.status(500).json({ success: false, message: 'Something went wrong on the server' });
}

module.exports = { apiNotFound, errorHandler };
