import express from 'express';
import {
  getGlobalDevData, verifyAdvisorNode, overrideAdvisorCredentials,
  editAdvisor, deleteAdvisor, editCustomer, deleteCustomer,
  createAdvisor, deleteApplication, authorizeRegistration, resetAllAdvisorTotals, devAddPayment,
  devRecordAdvisorPayout
} from '../controllers/devControllers.js';
import { protectDev, protectDevOrOwner } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All dev routes are protected — require a valid dev portal JWT
router.get('/data', protectDevOrOwner, getGlobalDevData);
router.put('/verify', protectDev, verifyAdvisorNode);
router.post('/reset-password', protectDev, overrideAdvisorCredentials);
router.post('/authorize-registration', protectDev, authorizeRegistration);

// Advisor CRUD
router.post('/advisor', protectDev, createAdvisor);
router.put('/advisor/:id', protectDev, editAdvisor);
router.delete('/advisor/:id', protectDev, deleteAdvisor);

// Customer CRUD
router.put('/customer/:id', protectDev, editCustomer);
router.delete('/customer/:id', protectDev, deleteCustomer);
router.post('/customer/:id/payment', protectDev, devAddPayment);
router.post('/customer/:id/advisor-payout', protectDev, devRecordAdvisorPayout);

// Applications
router.delete('/application/:id', protectDev, deleteApplication);

// Reset all advisor business totals
router.post('/reset-advisor-totals', protectDev, resetAllAdvisorTotals);

export default router;
