import express from 'express';
import { devLogin, ownerLogin, ownerVerifySecret, getCredentials, updateCredentials } from '../controllers/authController.js';
import { protectDev } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public auth endpoints
router.post('/dev/login', devLogin);
router.post('/owner/login', ownerLogin);
router.post('/owner/verify-secret', ownerVerifySecret);

// Protected credential management (dev only)
router.get('/credentials', protectDev, getCredentials);
router.put('/credentials', protectDev, updateCredentials);

export default router;
