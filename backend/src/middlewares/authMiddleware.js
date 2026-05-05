import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

// ─── Original advisor middleware ──────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token, authorization denied' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Token has expired or is invalid' });
      req.advisorId = decoded.advisorId;
      next();
    });
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Dev portal middleware ────────────────────────────────────────────────────
export const protectDev = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Dev portal: no token provided.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Dev portal: no token provided.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.portal !== 'dev') return res.status(403).json({ message: 'Dev portal access required.' });
    req.portalRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired dev token.' });
  }
};

// ─── Dev OR Owner read middleware (for shared read-only routes) ──────────────
export const protectDevOrOwner = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.portal !== 'dev' && decoded.portal !== 'owner') {
      return res.status(403).json({ message: 'Dev or Owner portal access required.' });
    }
    req.portalRole = decoded.role || decoded.portal;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ─── Owner/MyPanel middleware ─────────────────────────────────────────────────
export const protectOwner = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Owner portal: no token provided.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Owner portal: no token provided.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.portal !== 'owner') return res.status(403).json({ message: 'Owner portal access required.' });
    req.portalRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired owner token.' });
  }
};

export { protect };
