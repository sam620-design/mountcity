import express from 'express';
import { registerAdvisor, loginAdvisor, getCustomers } from '../controllers/advisorControllers.js';
import { protect } from '../middlewares/authMiddleware.js';
import { getAdvisorData,createlead,googleLogin,updateIncentive,enquariesForm,updatebook,confirmbook, registerLead, updateProfile } from '../controllers/advisorControllers.js';

const router = express.Router();

// Signup Route for Advisor
router.post('/signup', registerAdvisor);

// Login Route for Advisor
router.post('/login', loginAdvisor);
router.get('/me',protect, getAdvisorData); 
router.post('/create-lead',createlead)
router.get('/:advisorId/customers',getCustomers)
router.post('/googleauth',googleLogin)
router.post('/:advisorId/update-incentives',updateIncentive);
router.post('/enquaries',enquariesForm)
router.post('/customers/:customerId/book',updatebook);

router.post('/customers/:customerId/confirmbook',confirmbook);
router.post('/customers/:customerId/register', registerLead);
router.put('/:advisorId/profile', protect, updateProfile);

// Change module.exports to export default
export default router;  // Use default export
 