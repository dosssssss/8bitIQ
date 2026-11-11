const userService = require('../services/userService');
const validate = require('../utils/validate');
const { unauthorized } = require('../utils/apiError');

// POST /api/login
// Body: { username, password }
// Wrong username and wrong password get the same answer on purpose.
function login(req, res) {
  const input = validate.body(req);
  const username = validate.requiredString(input.username, 'username');
  const password = validate.requiredString(input.password, 'password', { maxLength: 72 });

  const user = userService.checkCredentials(username, password);
  if (!user) throw unauthorized('Invalid username or password');

  const token = userService.createToken(user.id);
  res.json({ success: true, user: userService.toPublic(user), token });
}

module.exports = { login };
