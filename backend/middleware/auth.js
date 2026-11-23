const userService = require('../services/userService');
const { unauthorized } = require('../utils/apiError');

// Reads "Authorization: Bearer <token>" and looks up the player.
//   - No header: the request carries on as a guest (req.user stays null).
//   - A header with a bad or expired token: 401, so the app knows to log in again.
// Sets req.user = { id, username } and req.token.
async function authenticate(req, res, next) {
  try {
    req.user = null;
    req.token = null;

    const header = req.get('authorization');
    if (!header) return next();

    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (!match) throw unauthorized('Authorization header must be "Bearer <token>"');

    const user = await userService.getUserByToken(match[1]);
    if (!user) throw unauthorized('Your login has expired. Please log in again.');

    req.user = userService.toPublic(user);
    req.token = match[1];
    next();
  } catch (err) {
    next(err);
  }
}

// Use after authenticate() on routes that need a logged-in player.
function requireLogin(req, res, next) {
  if (!req.user) return next(unauthorized('Please log in first'));
  next();
}

module.exports = { authenticate, requireLogin };