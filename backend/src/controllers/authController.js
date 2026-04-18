import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import PortalConfig from '../models/PortalConfig.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';
const DEV_TOKEN_EXPIRY = '8h';
const OWNER_TOKEN_EXPIRY = '8h';

// ─── POST /api/auth/dev/login ─────────────────────────────────────────────────
export async function devLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required.' });

    const config = await PortalConfig.findOne();
    if (!config)
      return res.status(500).json({ message: 'Portal not configured yet.' });

    if (username !== config.devUsername)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await config.compareDevPassword(password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ role: 'dev', portal: 'dev' }, JWT_SECRET, { expiresIn: DEV_TOKEN_EXPIRY });
    return res.json({ token, username: config.devUsername });
  } catch (err) {
    console.error('devLogin error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─── POST /api/auth/owner/login ───────────────────────────────────────────────
export async function ownerLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required.' });

    const config = await PortalConfig.findOne();
    if (!config)
      return res.status(500).json({ message: 'Portal not configured yet.' });

    if (username !== config.ownerUsername)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await config.compareOwnerPassword(password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    // Issue a temp token — still needs secret word verification
    const tempToken = jwt.sign({ role: 'owner', portal: 'owner', step: 'password' }, JWT_SECRET, { expiresIn: '10m' });
    return res.json({ tempToken, username: config.ownerUsername });
  } catch (err) {
    console.error('ownerLogin error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─── POST /api/auth/owner/verify-secret ──────────────────────────────────────
export async function ownerVerifySecret(req, res) {
  try {
    const { tempToken, secretWord } = req.body;
    if (!tempToken || !secretWord)
      return res.status(400).json({ message: 'Token and secret word are required.' });

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    if (decoded.portal !== 'owner' || decoded.step !== 'password')
      return res.status(401).json({ message: 'Invalid token.' });

    const config = await PortalConfig.findOne();
    if (!config)
      return res.status(500).json({ message: 'Portal not configured yet.' });

    const match = await config.compareOwnerSecret(secretWord);
    if (!match)
      return res.status(401).json({ message: 'Incorrect secret word.' });

    // Full access token
    const token = jwt.sign({ role: 'owner', portal: 'owner' }, JWT_SECRET, { expiresIn: OWNER_TOKEN_EXPIRY });
    return res.json({ token });
  } catch (err) {
    console.error('ownerVerifySecret error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─── GET /api/auth/credentials ── get usernames only (requires dev token) ────
export async function getCredentials(req, res) {
  try {
    const config = await PortalConfig.findOne();
    if (!config) return res.status(404).json({ message: 'Config not found.' });
    return res.json({
      devUsername: config.devUsername,
      ownerUsername: config.ownerUsername,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─── PUT /api/auth/credentials ── update credentials (requires dev token) ─────
export async function updateCredentials(req, res) {
  try {
    const { field, newValue } = req.body;
    const ALLOWED = ['devUsername', 'devPassword', 'ownerUsername', 'ownerPassword', 'ownerSecretWord'];
    if (!field || !newValue)
      return res.status(400).json({ message: 'field and newValue are required.' });
    if (!ALLOWED.includes(field))
      return res.status(400).json({ message: 'Invalid field.' });

    const config = await PortalConfig.findOne();
    if (!config)
      return res.status(404).json({ message: 'Config not found.' });

    if (field === 'devUsername') {
      if (newValue.trim().length < 4) return res.status(400).json({ message: 'Username must be at least 4 characters.' });
      config.devUsername = newValue.trim();
    } else if (field === 'devPassword') {
      if (newValue.length < 8) return res.status(400).json({ message: 'Dev password must be at least 8 characters.' });
      config.devPasswordHash = await bcrypt.hash(newValue, 12);
    } else if (field === 'ownerUsername') {
      if (newValue.trim().length < 4) return res.status(400).json({ message: 'Username must be at least 4 characters.' });
      config.ownerUsername = newValue.trim();
    } else if (field === 'ownerPassword') {
      if (newValue.length < 8) return res.status(400).json({ message: 'Owner password must be at least 8 characters.' });
      config.ownerPasswordHash = await bcrypt.hash(newValue, 12);
    } else if (field === 'ownerSecretWord') {
      if (newValue.length < 4) return res.status(400).json({ message: 'Secret word must be at least 4 characters.' });
      config.ownerSecretWordHash = await bcrypt.hash(newValue, 12);
    }

    await config.save();
    return res.json({ message: `${field} updated successfully.` });
  } catch (err) {
    console.error('updateCredentials error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}
