import Advisor from '../models/Advisor.js';
import Customer from '../models/Customer.js';
import Apply from '../models/Apply.js';
import bcrypt from 'bcryptjs';
import { getCommissionSlab, lockCommissions, releaseCommissions, getAdvisorBadge } from '../utils/commissions.js';

// Get comprehensive site data for Dev Portal
export const getGlobalDevData = async (req, res) => {
  try {
    const advisors = await Advisor.find().sort({ date: -1 }).populate('connectedAdvisors', 'name email').populate('parentAdvisor', 'name email');
    const customers = await Customer.find().sort({ actualDate: -1 }).populate('advisor', 'name email advisorId').populate('commissionDistribution.advisor', 'name email advisorId');
    const applications = await Apply.find().sort({ date: -1 });
    
    const normalizeStatus = (s = '') => {
      const u = s.toUpperCase();
      if (u === 'CONFIRMED') return 'REGISTERED';
      if (u === 'NOT-CONFIRMED' || u === 'WAITING') return 'WAITING';
      if (u === 'BOOKED') return 'BOOKED';
      if (u === 'REGISTERED') return 'REGISTERED';
      if (u === 'PENDING_REGISTRATION') return 'PENDING_REGISTRATION';
      return u || 'WAITING';
    };
    const totalRevenue = customers.filter(c => ['BOOKED','REGISTERED','booked','confirmed'].includes(c.status))
      .reduce((sum, c) => sum + (c.finalAmount || 0), 0);
    const statusCounts = customers.reduce((acc, c) => {
      const s = normalizeStatus(c.status);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const revenueByAdvisor = advisors.map(a => ({ name: a.name, advisorId: a.advisorId, totalBusiness: a.totalBusiness || 0, selfBusiness: a.selfBusiness || 0, teamSize: a.connectedAdvisors?.length || 0 }));

    res.status(200).json({ advisors, customers, applications, stats: { totalRevenue, statusCounts, revenueByAdvisor } });
  } catch (error) {
    console.error('Error fetching global dev data:', error);
    res.status(500).json({ message: 'Server Error loading dev aggregation' });
  }
};

// Admin forces verification and binds the advisor hierarchy
export const verifyAdvisorNode = async (req, res) => {
  const { targetAdvisorId, parentAdvisorId, customAdvisorId } = req.body;
  
  try {
    const targetAdvisor = await Advisor.findById(targetAdvisorId);
    if (!targetAdvisor) {
       return res.status(404).json({ message: 'Target advisor not found' });
    }

    if (targetAdvisor.verified) {
       return res.status(400).json({ message: 'Advisor is already verified.'});
    }

    targetAdvisor.verified = true;
    if (customAdvisorId) {
       targetAdvisor.advisorId = customAdvisorId;
    }

    if (parentAdvisorId !== 'MAIN_COMPANY') {
       const parent = await Advisor.findById(parentAdvisorId);
       if (!parent) return res.status(404).json({ message: 'Selected Parent Advisor not found' });
       
       targetAdvisor.parentAdvisor = parent._id;
       await targetAdvisor.save();

       await Advisor.findByIdAndUpdate(parent._id, {
         $addToSet: { connectedAdvisors: targetAdvisor._id }
       });
    } else {
       targetAdvisor.parentAdvisor = null;
       await targetAdvisor.save();
    }

    res.status(200).json({ message: 'Advisor successfully verified and nested in hierarchy!', advisor: targetAdvisor });
  } catch (error) {
    console.error('Error verifying advisor:', error);
    res.status(500).json({ message: 'Internal Server Error during verification' });
  }
};

// Admin explicitly resets an advisor authentication password
export const overrideAdvisorCredentials = async (req, res) => {
  const { targetAdvisorId, newPassword } = req.body;
  
  try {
    const targetAdvisor = await Advisor.findById(targetAdvisorId);
    if (!targetAdvisor) {
       return res.status(404).json({ message: 'Target advisor not found' });
    }
    
    if (!newPassword || newPassword.length < 5) {
       return res.status(400).json({ message: 'Invalid password requirement' });
    }

    targetAdvisor.password = newPassword;
    targetAdvisor.passwordPlain = newPassword;
    await targetAdvisor.save();

    res.status(200).json({ message: 'Advisor authentication forcefully overridden!' });
  } catch (error) {
    console.error('Error overriding credentials:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Site Registration Authorization from Dev Portal
export const authorizeRegistration = async (req, res) => {
  const { customerId, action } = req.body; // action: 'APPROVE' or 'REJECT'
  
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    if (customer.status !== 'PENDING_REGISTRATION') {
       return res.status(400).json({ message: 'Customer is not in PENDING_REGISTRATION status.' });
    }

    if (action === 'REJECT') {
       customer.status = 'BOOKED'; // Revert to booked
       await customer.save();
       return res.status(200).json({ message: 'Registration rejected. Lead reverted to BOOKED.', customer });
    }

    // --- APPROVAL FLOW ---
    const oldStatus = 'PENDING_REGISTRATION';
    const oldFinalAmount = customer.finalAmount || 0;
    
    // Automatically enforce 100% payout alignment upon authorization
    const outstanding = customer.finalAmount - (customer.amountPaid || customer.bookingAmount || 0);
    if (outstanding > 0) {
        customer.amountPaid = customer.finalAmount;
        if (!customer.payments) customer.payments = [];
        customer.payments.push({
            date: new Date(),
            amount: outstanding,
            paymentMode: 'Auto-Settlement (Registration Authorized)'
        });
    }

    customer.status = 'REGISTERED';
    customer.isFullyPaid = true;
    await customer.save();

    // Trigger shared commission logic in case they were not locked yet
    await lockCommissions(customer);
    await releaseCommissions(customer);

    res.status(200).json({ message: 'Site Registration AUTHORIZED! Commissions successfully updated.', customer });
  } catch (error) {
    console.error('Authorization Error:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
};

// --- NEW: Full Edit Advisor ---
export const editAdvisor = async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, advisorId, role, verified, pan, aadhar, address, totalBusiness, selfBusiness } = req.body;
  try {
    const updated = await Advisor.findByIdAndUpdate(id, 
      { name, email, phoneNumber, advisorId, role, verified, pan, aadhar, address, totalBusiness, selfBusiness },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Advisor not found' });
    res.status(200).json({ message: 'Advisor updated', advisor: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update advisor', error: err.message });
  }
};

// --- NEW: Delete Advisor ---
export const deleteAdvisor = async (req, res) => {
  const { id } = req.params;
  try {
    const adv = await Advisor.findById(id);
    if (!adv) return res.status(404).json({ message: 'Advisor not found' });

    // Remove from parent's connectedAdvisors
    if (adv.parentAdvisor) {
      await Advisor.findByIdAndUpdate(adv.parentAdvisor, { $pull: { connectedAdvisors: adv._id } });
    }
    // Unassign their customers
    await Customer.updateMany({ advisor: adv._id }, { $unset: { advisor: '' } });

    await Advisor.findByIdAndDelete(id);
    res.status(200).json({ message: 'Advisor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete advisor', error: err.message });
  }
};

// --- NEW: Full Edit Customer/Lead ---
export const editCustomer = async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['name', 'phoneNumber', 'email', 'address', 'aadhar', 'projectName', 'plotNumber', 'plotSize', 
    'status', 'block', 'price', 'finalAmount', 'bookingAmount', 'paymentMode', 'advisor'];
  const update = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
  try {
    const updated = await Customer.findByIdAndUpdate(id, update, { new: true }).populate('advisor', 'name email');
    if (!updated) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ message: 'Customer updated', customer: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer', error: err.message });
  }
};

// --- NEW: Delete Customer ---
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const cust = await Customer.findById(id);
    if (!cust) return res.status(404).json({ message: 'Customer not found' });

    const amountToReverse = cust.finalAmount || 0;
    const wasBooked = ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(
      (cust.status || '').toUpperCase()
    );

    // Remove from advisor's customers list
    if (cust.advisor) {
      await Advisor.findByIdAndUpdate(cust.advisor, {
        $pull: { customers: cust._id },
        $inc: { leads: -1 }
      });

      // Reverse the business totals up the chain if amount was counted
      if (wasBooked && amountToReverse > 0) {
        let currentAdvisorId = cust.advisor;
        while (currentAdvisorId) {
          const adv = await Advisor.findById(currentAdvisorId);
          if (!adv) break;

          if (adv._id.toString() === cust.advisor.toString()) {
            adv.selfBusiness = Math.max(0, (adv.selfBusiness || 0) - amountToReverse);
          } else {
            adv.teamBusiness = Math.max(0, (adv.teamBusiness || 0) - amountToReverse);
          }
          adv.totalBusiness = (adv.selfBusiness || 0) + (adv.teamBusiness || 0);

          // Recalculate commission slab
          const { slab } = getCommissionSlab(adv.totalBusiness);
          adv.currentSlab = slab;

          // Recalculate incentives based on remaining selfBusiness
          adv.incentives = (adv.selfBusiness || 0) * (getCommissionSlab(adv.totalBusiness).percent / 100);

          await adv.save();
          currentAdvisorId = adv.parentAdvisor;
        }
      }
    }

    // Reverse locked and released commissions from all advisors involved in this sale
    if (cust.commissionDistribution && cust.commissionDistribution.length > 0) {
      for (let dist of cust.commissionDistribution) {
        if (dist.advisor) {
          await Advisor.findByIdAndUpdate(dist.advisor, {
            $inc: { 
               totalCommissionEarned: -(dist.earnedAmount || 0),
               totalCommissionReleased: -(dist.releasedAmount || 0)
            }
          });
        }
      }
    }

    await Customer.findByIdAndDelete(id);
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customer', error: err.message });
  }
};



// --- Create Advisor from Portal ---
export const createAdvisor = async (req, res) => {
  const { name, email, phoneNumber, password, role, advisorId, parentAdvisorId } = req.body;
  try {
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: 'Name, email, phone, and password are required' });
    }
    const existing = await Advisor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const advisor = new Advisor({
      name, email, phoneNumber, password,
      passwordPlain: password,
      role: role || 'advisor',
      advisorId: advisorId || undefined,
      verified: true,
      parentAdvisor: parentAdvisorId && parentAdvisorId !== 'MAIN_COMPANY' ? parentAdvisorId : null
    });
    await advisor.save();

    if (parentAdvisorId && parentAdvisorId !== 'MAIN_COMPANY') {
      await Advisor.findByIdAndUpdate(parentAdvisorId, { $addToSet: { connectedAdvisors: advisor._id } });
    }

    res.status(201).json({ message: 'Advisor created successfully', advisor });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create advisor', error: err.message });
  }
};

// --- Delete Application/Enquiry ---
export const deleteApplication = async (req, res) => {
  const { id } = req.params;
  try {
    await Apply.findByIdAndDelete(id);
    res.status(200).json({ message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete application' });
  }
};

// --- Reset All Advisor Totals from scratch ---
export const resetAllAdvisorTotals = async (req, res) => {
  try {
    const advisors = await Advisor.find();
    const customers = await Customer.find();

    const activeSt = ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'];

    const getAllDescendants = (advisorId, all) => {
      const direct = all.filter(a => a.parentAdvisor?.toString() === advisorId.toString());
      let desc = [...direct];
      direct.forEach(d => { desc = desc.concat(getAllDescendants(d._id, all)); });
      return desc;
    };

    const targetId = req.body.advisorId;
    const advisorsToProcess = targetId ? advisors.filter(a => a._id.toString() === targetId) : advisors;

    for (const adv of advisorsToProcess) {
      const advId = adv._id.toString();

      const selfCusts = customers.filter(
        c => activeSt.includes((c.status || '').toUpperCase()) &&
             c.advisor?.toString() === advId
      );
      const parseAmt = (val) => {
        if (!val) return 0;
        if (typeof val === 'string') {
           const num = Number(val.replace(/,/g, ''));
           return isNaN(num) ? 0 : num;
        }
        return Number(val) || 0;
      };

      const selfBusiness = selfCusts.reduce((s, c) => s + parseAmt(c.finalAmount), 0);

      const descendants = getAllDescendants(adv._id, advisors);
      const descIds = new Set(descendants.map(d => d._id.toString()));
      const teamCusts = customers.filter(
        c => activeSt.includes((c.status || '').toUpperCase()) &&
             c.advisor && descIds.has(c.advisor.toString())
      );
      const teamBusiness = teamCusts.reduce((s, c) => s + parseAmt(c.finalAmount), 0);

      const totalBusiness = selfBusiness + teamBusiness;
      const { percent, slab } = getCommissionSlab(totalBusiness);

      // Re-calculate the actual earned and released commissions based on active distribution
      let myEarned = 0;
      let myReleased = 0;
      customers.forEach(c => {
         if (!activeSt.includes((c.status || '').toUpperCase())) return;
         if (c.commissionDistribution && c.commissionDistribution.length > 0) {
            const dist = c.commissionDistribution.find(d => 
               (d.advisor?._id || d.advisor)?.toString() === advId
            );
            if (dist) {
               myEarned += dist.earnedAmount || 0;
               myReleased += dist.releasedAmount || 0;
            }
         }
      });

      adv.selfBusiness = selfBusiness;
      adv.teamBusiness = teamBusiness;
      adv.totalBusiness = totalBusiness;
      adv.currentSlab = slab;
      adv.badge = getAdvisorBadge(totalBusiness);
      // Fallback for legacy
      adv.incentives = selfBusiness * percent / 100;
      
      // New Exact Commission totals
      adv.totalCommissionEarned = myEarned;
      adv.totalCommissionReleased = myReleased;
      
      await adv.save();
    }

    res.status(200).json({ message: `Advisor totals reset for ${advisors.length} advisors.` });
  } catch (err) {
    console.error('Error resetting advisor totals:', err);
    res.status(500).json({ message: 'Failed to reset advisor totals', error: err.message });
  }
};

// --- Add Payment Logic (Moved from Advisor to Dev) ---
export const devAddPayment = async (req, res) => {
  const { id } = req.params;
  const { amount, paymentDate, note } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Valid payment amount is required' });
  }

  // Validate paymentDate — must not be in the future
  let resolvedDate = new Date();
  if (paymentDate) {
    const parsed = new Date(paymentDate);
    if (!isNaN(parsed.getTime())) {
      if (parsed > new Date()) {
        return res.status(400).json({ message: 'Payment date cannot be in the future' });
      }
      resolvedDate = parsed;
    }
  }

  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    customer.payments.push({ amount, date: resolvedDate, note: note || '' });
    customer.amountPaid = (customer.amountPaid || 0) + amount;
    await customer.save();

    await releaseCommissions(customer);

    res.status(200).json({ message: 'Payment recorded successfully', customer });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ message: 'Server error adding payment' });
  }
};

// --- Actual Commission Payout to Advisor (recorded by Dev via portal) ---
export const devRecordAdvisorPayout = async (req, res) => {
  const { id } = req.params;                   // customer id
  const { advisorId, amount, payoutDate, note } = req.body;

  if (!advisorId) return res.status(400).json({ message: 'advisorId is required' });
  if (!amount || isNaN(amount) || amount <= 0)
    return res.status(400).json({ message: 'Valid payout amount is required' });

  let resolvedDate = new Date();
  if (payoutDate) {
    const parsed = new Date(payoutDate);
    if (!isNaN(parsed.getTime())) {
      if (parsed > new Date())
        return res.status(400).json({ message: 'Payout date cannot be in the future' });
      resolvedDate = parsed;
    }
  }

  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (!customer.advisorPayouts) customer.advisorPayouts = [];
    customer.advisorPayouts.push({
      advisor: advisorId,
      amount:  Number(amount),
      date:    resolvedDate,
      note:    note || ''
    });
    await customer.save();

    const populated = await customer.populate('advisorPayouts.advisor', 'name email advisorId');
    res.status(200).json({ message: 'Commission payout recorded successfully', customer: populated });
  } catch (error) {
    console.error('Error recording advisor payout:', error);
    res.status(500).json({ message: 'Server error recording advisor payout' });
  }
};
