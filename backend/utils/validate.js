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

// 3 to 20 characters: letters, numbers and underscores only.
function username(value) {
  const name = requiredString(value, 'username', { maxLength: 20 }).trim();
  if (name.length < 3) {
    throw badRequest('username must be at least 3 characters');
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw badRequest('username can only contain letters, numbers and underscores');
  }
  return name;
}

// 8 to 72 characters (72 keeps it compatible if we switch to bcrypt later).
// Spaces are allowed and the password is never trimmed.
function password(value) {
  if (value === undefined || value === null || value === '') {
    throw badRequest('password is required');
  }
  if (typeof value !== 'string') {
    throw badRequest('password must be a string');
  }
  if (value.length < 8) {
    throw badRequest('password must be at least 8 characters');
  }
  if (value.length > 72) {
    throw badRequest('password must be at most 72 characters');
  }
  return value;
}

// For query strings like ?limit=10. Returns the default when it's missing.
function optionalInt(value, name, { min, max, defaultValue }) {
  if (value === undefined || value === '') return defaultValue;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw badRequest(`${name} must be a whole number`);
  }
  const number = Number(value);
  if (number < min || number > max) {
    throw badRequest(`${name} must be between ${min} and ${max}`);
  }
  return number;
}

module.exports = {
  body,
  requiredString,
  optionalString,
  requiredBoolean,
  optionalInt,
  username,
  password,
};
