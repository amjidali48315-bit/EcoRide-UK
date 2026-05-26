const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'escooter_jwt_secret';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function extractBearer(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function requireAdmin(req, res, next) {
  // Check JWT token first
  const token = extractBearer(req);
  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded.role === 'admin') {
        req.admin = decoded;
        return next();
      }
    } catch {}
  }
  // Fall back to session
  if (req.session?.admin_logged_in) return next();
  return res.status(401).json({ error: 'Admin authentication required.' });
}

function requireCustomer(req, res, next) {
  const token = extractBearer(req);
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'customer') throw new Error('Not a customer token');
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

function requireDriver(req, res, next) {
  const token = extractBearer(req);
  if (!token) return res.status(401).json({ error: 'Driver authentication required.' });
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'driver') throw new Error('Not a driver token');
    req.driver = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = { requireAdmin, requireCustomer, requireDriver, signToken, verifyToken, extractBearer };
