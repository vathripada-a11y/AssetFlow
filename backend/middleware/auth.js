const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifies the JWT from the Authorization header and attaches the
// decoded employee info (id, role, department_id) to req.user.
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided.' });
  }

  const token = header.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'change_this_to_a_long_random_string');
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Server authentication misconfigured.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = authenticate;
