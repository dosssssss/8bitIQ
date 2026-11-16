const userService = require('../services/userService');
const validate = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');
const { unauthorized } = require('../utils/apiError');

async function login(req, res) {
  const input = validate.body(req);
  const username = validate.requiredString(input.username, 'username');
  const password = validate.requiredString(input.password, 'password', { maxLength: 72 });

  const user = await userService.checkCredentials(username, password);
  if (!user) throw unauthorized('Invalid username or password');

  const token = await userService.createToken(user.id);
  res.json({ success: true, user: userService.toPublic(user), token });
}

module.exports = { login: asyncHandler(login) };
