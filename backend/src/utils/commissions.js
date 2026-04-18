import Advisor from '../models/Advisor.js';
import Customer from '../models/Customer.js';

export const getAdvisorBadge = (totalBusiness) => {
  if (totalBusiness >= 250000000) return 'Diamond';
  if (totalBusiness >= 50000000) return 'Platinum';
  if (totalBusiness >= 5000000) return 'Gold';
  if (totalBusiness >= 500000) return 'Silver';
  return 'Bronze';
};

export const getCommissionSlab = (total) => {
  if (total >= 1100000000) return { percent: 18, slab: 10 };
  if (total >= 550000000) return { percent: 17, slab: 9 };
  if (total >= 250000000) return { percent: 16, slab: 8 };
  if (total >= 100000000) return { percent: 15, slab: 7 };
  if (total >= 50000000) return { percent: 14, slab: 6 };
  if (total >= 10000000) return { percent: 13, slab: 5 };
  if (total >= 5000000) return { percent: 11, slab: 4 };
  if (total >= 2500000) return { percent: 9, slab: 3 };
  if (total >= 500000) return { percent: 7, slab: 2 };
  return { percent: 5, slab: 1 };
};

/**
 * Returns the minimum self_business required for a given slab.
 * Used to gate upline commission eligibility (T&C SELF check).
 */
const getRequiredSelfBusiness = (slab) => {
  switch (slab) {
    case 10: return 50000000;  // ₹5 Cr
    case 9:  return 20000000;  // ₹2 Cr
    case 8:  return 10000000;  // ₹1 Cr
    case 7:  return 7500000;   // ₹75 L
    case 6:  return 5000000;   // ₹50 L
    case 5:  return 3500000;   // ₹35 L
    case 4:  return 2000000;   // ₹20 L
    case 3:  return 1000000;   // ₹10 L
    case 2:  return 500000;    // ₹5 L
    default: return 0;          // Slab 1 — no self requirement
  }
};

export const lockCommissions = async (customer) => {
  // Prevent double locking
  if (customer.commissionDistribution && customer.commissionDistribution.length > 0) {
     return customer;
  }

  let currentDist = [];
  let totalPercentGiven = 0;
  let isSeller = true;
  let currentAdvisorId = customer.advisor;
  const saleAmount = customer.finalAmount;

  while (currentAdvisorId && totalPercentGiven < 18) {
    const adv = await Advisor.findById(currentAdvisorId);
    if (!adv) break;

    const { percent, slab } = getCommissionSlab(adv.totalBusiness);
    let percentToGive = 0;
    let isEligible = true;

    if (isSeller) {
       percentToGive = percent;
       isEligible = true; // Seller is always eligible for their own commission
    } else {
       // --- UPLINE SELF SALE ELIGIBILITY CHECK (T&C SELF) ---
       const requiredSelf = getRequiredSelfBusiness(slab);
       isEligible = (adv.selfBusiness || 0) >= requiredSelf;

       if (!isEligible) {
          // Ineligible — store POTENTIAL amount so UI can show strikethrough
          // but mark eligible=false so it is NEVER released or counted
          const potentialPercent = percent <= 13 ? 2 : 1;
          const potentialEarned = saleAmount * (potentialPercent / 100);
          currentDist.push({
            advisor: adv._id,
            percent: potentialPercent,      // actual upline rate they WOULD get
            earnedAmount: potentialEarned,  // amount they WOULD have earned
            releasedAmount: 0,
            eligible: false,               // frozen as ineligible — never released
            isDirectSale: false
          });
          // NOTE: do NOT add potentialEarned to adv.totalCommissionEarned
          isSeller = false;
          currentAdvisorId = adv.parentAdvisor;
          continue;
       }

       if (percent <= 13) {
          percentToGive = 2;
       } else {
          percentToGive = 1;
       }
    }

    if (totalPercentGiven + percentToGive > 18) {
       percentToGive = 18 - totalPercentGiven;
    }

    if (percentToGive > 0) {
       const earnedAmount = saleAmount * (percentToGive / 100);
       currentDist.push({
         advisor: adv._id,
         percent: percentToGive,
         earnedAmount: earnedAmount,
         releasedAmount: 0,
         eligible: true,
         isDirectSale: isSeller
       });
       
       totalPercentGiven += percentToGive;
       
       // Add to Advisor's earned total
       adv.totalCommissionEarned = (adv.totalCommissionEarned || 0) + earnedAmount;
       await adv.save();
    }

    isSeller = false;
    currentAdvisorId = adv.parentAdvisor; // go to upline
  }

  customer.commissionDistribution = currentDist;
  
  if (totalPercentGiven < 18) {
     const companyPercent = 18 - totalPercentGiven;
     customer.companySharePercent = companyPercent;
     customer.companyShareAmount = saleAmount * (companyPercent / 100);
  } else {
     customer.companySharePercent = 0;
     customer.companyShareAmount = 0;
  }

  return await customer.save();
};

export const releaseCommissions = async (customer) => {
  if (!customer.commissionDistribution || customer.commissionDistribution.length === 0) {
    return customer;
  }

  if (customer.finalAmount <= 0) return customer;

  let releaseRatio = customer.amountPaid / customer.finalAmount;
  if (releaseRatio > 1) releaseRatio = 1;

  for (let dist of customer.commissionDistribution) {
    // Never release commission for ineligible advisors
    if (dist.eligible === false) continue;
    let targetReleased = dist.earnedAmount * releaseRatio;
    
    // Safety check - NEVER release more than earned
    if (targetReleased > dist.earnedAmount) {
       targetReleased = dist.earnedAmount;
    }

    let newlyReleased = targetReleased - dist.releasedAmount;
    
    if (newlyReleased > 0) {
      dist.releasedAmount += newlyReleased;
      
      const adv = await Advisor.findById(dist.advisor);
      if (adv) {
         adv.totalCommissionReleased = (adv.totalCommissionReleased || 0) + newlyReleased;
         
         // Keep legacy incentives updated just in case older models depend on it
         adv.incentives = (adv.incentives || 0) + newlyReleased;
         await adv.save();
      }
    }
  }

  return await customer.save();
};
