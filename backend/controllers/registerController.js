const userService = require('../services/userService');
const validate = require('../utils/validate');
const { conflict } = require('../utils/apiError');

function register(req, res) {
  const input = validate.body(req);
  const username = validate.username(input.username);
  const password = validate.password(input.password);

  const user = userService.createUser(username, password);
  if (!user) throw conflict('That username is already taken');

  const token = userService.createToken(user.id);
  res.status(201).json({ success: true, user: userService.toPublic(user), token });
}

module.exports = { register };
