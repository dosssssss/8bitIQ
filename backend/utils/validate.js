const { badRequest } = require('./apiError');

// Small checks for request bodies. Each one throws a 400 ApiError with a
// clear message, which the error handler in server.js sends back.

function body(req) {
  const value = req.body;
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('Request body must be a JSON object');
  }
  return value;
}

function requiredString(value, name, { maxLength = 100 } = {}) {
  if (value === undefined || value === null || value === '') {
    throw badRequest(`${name} is required`);
  }
  if (typeof value !== 'string') {
    throw badRequest(`${name} must be a string`);
  }
  if (value.trim() === '') {
    throw badRequest(`${name} is required`);
  }
  if (value.length > maxLength) {
    throw badRequest(`${name} must be at most ${maxLength} characters`);
  }
  return value;
}

function optionalString(value, name, options) {
  if (value === undefined || value === null) return null;
  return requiredString(value, name, options);
}

function requiredBoolean(value, name) {
  if (value === undefined || value === null) {
    throw badRequest(`${name} is required`);
  }
  if (typeof value !== 'boolean') {
    throw badRequest(`${name} must be true or false`);
  }
  return value;
}

module.exports = { body, requiredString, optionalString, requiredBoolean };
