import React, { useState, useEffect } from 'react';
import { RiNotification3Line, RiSettings3Line, RiMoneyRupeeCircleLine, RiBarChartFill, RiPercentLine, RiMedalFill } from "react-icons/ri";
import { apiAdvisors } from '../../config/api.js';
import { Profile } from '..';

const SLABS_DATA = [
  { level: 1, rate: 5,  name: 'Joined', total: 0, self: 0 },
  { level: 2, rate: 7,  name: 'Mobile', total: 500000, self: 500000 },
  { level: 3, rate: 9,  name: 'Fridge', total: 2500000, self: 1000000 },
  { level: 4, rate: 11, name: 'Scooty', total: 5000000, self: 2000000 },
  { level: 5, rate: 13, name: 'i10', total: 10000000, self: 3500000 },
  { level: 6, rate: 14, name: 'XUV-300', total: 50000000, self: 5000000 },
  { level: 7, rate: 15, name: 'Nexon', total: 100000000, self: 7500000 },
  { level: 8, rate: 16, name: 'XUV-700', total: 250000000, self: 10000000 },
  { level: 9, rate: 17, name: 'Fortuner', total: 550000000, self: 20000000 },
  { level: 10, rate: 18, name: 'BMW', total: 1100000000, self: 50000000 },
];

const inr = (v) => v ? `₹${Math.round(v).toLocaleString('en-IN')}` : '₹0';

function getSlabFor(a) {
  let res = SLABS_DATA[0];
  for (let s of SLABS_DATA) {
    if ((a.totalBusiness || 0) >= s.total && (a.selfBusiness || 0) >= s.self) res = s;
    else break;
  }
  return res;
}

function getAllAdvisorsInTree(advisor) {
  let res = [advisor];
  (advisor.connectedAdvisors || []).forEach(child => {
    res = res.concat(getAllAdvisorsInTree(child));
  });
  return res;
}

function getTreeSales(advisor, allMonthlySales) {
  const aid = (advisor._id || advisor.id || '').toString();
  let sales = allMonthlySales.filter(c => {
    const cid = (c.advisor?._id || c.advisor || '').toString();
    return cid === aid;
  });
  (advisor.connectedAdvisors || []).forEach(child => {
    sales = sales.concat(getTreeSales(child, allMonthlySales));
  });
  return sales;
}

function getIncentiveDetails(advisor, advisors, allMonthlySales) {
  const aid = (advisor._id || advisor.id || '').toString();
  
  // Calculate exact sums from the distribution entries for this advisor
  let actualEarnedThisMonth = 0;
  let actualReleasedThisMonth = 0;

  allMonthlySales.forEach(lead => {
    const dist = (lead.commissionDistribution || []).find(d => 
      (d.advisor?._id || d.advisor || '').toString() === aid
    );
    if (dist) {
      actualEarnedThisMonth += (dist.earnedAmount || 0);
      actualReleasedThisMonth += (dist.releasedAmount || 0);
    }
  });

  const myDirectSales = allMonthlySales.filter(c => {
    const cid = (c.advisor?._id || c.advisor || '').toString();
    return cid === aid;
  });

  const teamBreakdown = [];
  (advisor.connectedAdvisors || []).forEach(child => {
    const childTreeSales = getTreeSales(child, allMonthlySales);
    const childTotalVolume = childTreeSales.reduce((s, c) => s + (c.finalAmount || 0), 0);
    
    if (childTotalVolume > 0) {
      teamBreakdown.push({
        childName: child.name,
        totalVolume: childTotalVolume,
        salesList: childTreeSales
      });
    }
  });

  return {
    advisor,
    myDirectSales,
    teamBreakdown,
    grandTotal: actualEarnedThisMonth,
    releasedTotal: actualReleasedThisMonth
  };
}


function IncentiveDashboard() {
  console.log("IncentiveDashboard synced v2 running");
  const [data, setData] = React.useState(null);
  const now = new Date();
  const [selMonth, setSelMonth] = React.useState(now.getMonth());
  const [selYear, setSelYear] = React.useState(now.getFullYear());
  const [showEarnedTip, setShowEarnedTip] = React.useState(false);
  const [showReleasedTip, setShowReleasedTip] = React.useState(false);

  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const storedData = sessionStorage.getItem('advisorData');
        if (storedData) {
          setData(JSON.parse(storedData));
        }
        if (!token) return;
        const res = await fetch(`${apiAdvisors}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const freshData = await res.json();
          setData(freshData);
        }
      } catch (err) {}
    };
    fetchFreshData();
  }, []);

  if (!data) return <div className="p-10 text-center text-xl font-bold text-gray-500 mt-16">Loading Tracking Constraints...</div>;

  // Extract core metrics
  const totalBus = data.totalBusiness || 0;
  const selfBus = data.selfBusiness || 0;
  const incentive = data.incentives || data.incentive || 0;

  // Exact Multi-Level Business Plan (Total vs Self constraints)
  const slabThresholds = [
    { level: 1, comm: 5,  name: 'JOINED', emoji: '🏁', tTotal: 0, tSelf: 0 },
    { level: 2, comm: 7,  name: 'MOBILE / 10K', emoji: '📱', tTotal: 500000, tSelf: 500000 },
    { level: 3, comm: 9,  name: 'REFRIGERATOR / 25K', emoji: '❄️', tTotal: 2500000, tSelf: 1000000 },
    { level: 4, comm: 11, name: 'SCOOTY / 50K', emoji: '🛵', tTotal: 5000000, tSelf: 2000000 },
    { level: 5, comm: 13, name: 'i10 / 3 LAC', emoji: '🚗', tTotal: 10000000, tSelf: 3500000 },
    { level: 6, comm: 14, name: 'XUV-300 / 5 LAC', emoji: '🚙', tTotal: 50000000, tSelf: 5000000 },
    { level: 7, comm: 15, name: 'NEXON / 10 LAC', emoji: '🚓', tTotal: 100000000, tSelf: 7500000 },
    { level: 8, comm: 16, name: 'XUV-700 / 25 LAC', emoji: '🚘', tTotal: 250000000, tSelf: 10000000 },
    { level: 9, comm: 17, name: 'FORTUNER / 50LAC', emoji: '🚐', tTotal: 550000000, tSelf: 20000000 },
    { level: 10, comm: 18, name: 'BMW / 75LAC', emoji: '🏆', tTotal: 1100000000, tSelf: 50000000 },
    { level: 11, comm: 18, name: 'DEFENDER / 1 CR', emoji: '🛡️', tTotal: 5010000000, tSelf: 100000000 }
  ];

  // Global lifetime metrics (raw from DB)
  const rawEarned  = data.totalCommissionEarned  || 0;
  const rawReleased = data.totalCommissionReleased || 0;

  // --- BUILD PER-LEAD COMMISSION BREAKDOWN ---
  // Scan ALL sales in the entire advisor tree (direct + downline) for this advisor's distribution entry
  // NOTE: allTreeSales and myId are used here, but allTreeSales is defined below.
  // We compute this AFTER defining allTreeSales. So we will compute it lazily via a helper called later.
  const myId = (data._id || data.id || '').toString();
  const fmt = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Direct customer IDs for tagging source
  const myDirectCustomerIds = new Set((data.customers || []).map(c => (c._id || c.id || '').toString()));


  // Determine earned reward index (for unlocking car/bonus rewards requires BOTH)
  let rewardIndex = 0;
  for (let i = 1; i < slabThresholds.length; i++) {
    if (totalBus >= slabThresholds[i].tTotal && selfBus >= slabThresholds[i].tSelf) {
      rewardIndex = i;
    } else {
      break;
    }
  }

  // Determine active commission percent (based ONLY on Total Business)
  let activeCommissionIndex = 0;
  for (let i = 1; i < slabThresholds.length; i++) {
    if (totalBus >= slabThresholds[i].tTotal) {
      activeCommissionIndex = i;
    } else {
      break;
    }
  }

  // Active Rate corresponding to the level you are currently in
  const rate = slabThresholds[activeCommissionIndex].comm;
  const prevTarget = slabThresholds[activeCommissionIndex];

  // --- ELIGIBILITY GATE ---
  // Advisor earns upline commission ONLY if their selfBusiness meets the required T&C for their slab
  const requiredSelfTnC = slabThresholds[activeCommissionIndex].tSelf;
  const isEligible = selfBus >= requiredSelfTnC;

  // Gate financial display values — zero everything out if not eligible
  const earnedVal   = isEligible ? rawEarned   : 0;
  const releasedVal = isEligible ? rawReleased  : 0;
  const pendingVal  = Math.max(0, earnedVal - releasedVal);
  
  // Next Reward: first slab where BOTH total AND self T&C are not yet achieved
  const firstUnearnedIdx = slabThresholds.findIndex(
    (slab, i) => i > 0 && !(totalBus >= slab.tTotal && selfBus >= slab.tSelf)
  );
  const currentTargetObj = firstUnearnedIdx !== -1 
    ? slabThresholds[firstUnearnedIdx] 
    : slabThresholds[slabThresholds.length - 1];
  const nextTargetObj = firstUnearnedIdx !== -1 && firstUnearnedIdx + 1 < slabThresholds.length 
    ? slabThresholds[firstUnearnedIdx + 1] 
    : currentTargetObj;


  // Calculate Progress Percentages (span from last completed target to the current target)
  const spanTotal = currentTargetObj.tTotal - prevTarget.tTotal;
  const progressTotal = totalBus - prevTarget.tTotal;
  const pTotalPercent = spanTotal === 0 ? 100 : Math.min(100, Math.max(0, (progressTotal / spanTotal) * 100));

  const spanSelf = currentTargetObj.tSelf - prevTarget.tSelf;
  const progressSelf = selfBus - prevTarget.tSelf;
  const pSelfPercent = spanSelf === 0 ? 100 : Math.min(100, Math.max(0, (progressSelf / spanSelf) * 100));

  // Determine lock statuses of Total vs Self
  const deltaTotal = Math.max(0, currentTargetObj.tTotal - totalBus);
  const deltaSelf = Math.max(0, currentTargetObj.tSelf - selfBus);

  const isMaxComm = activeCommissionIndex === slabThresholds.length - 1;
  const nextCommObj = isMaxComm ? slabThresholds[activeCommissionIndex] : slabThresholds[activeCommissionIndex + 1];
  const deltaCommTotal = Math.max(0, nextCommObj.tTotal - totalBus);
  const deltaCommSelf = Math.max(0, nextCommObj.tSelf - selfBus);

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Full Month Sales for Dynamic Calc
  const allTreeAdvisors = data ? getAllAdvisorsInTree(data) : [];
  const allTreeSales = allTreeAdvisors.flatMap(a => (a.customers || []));

  // --- LIFETIME PAYOUT TRACKING ---
  const totalPaidByCompany = allTreeSales.reduce((sum, c) => {
    const myPayouts = (c.advisorPayouts || []).filter(p => 
      (p.advisor?._id || p.advisor || '').toString() === myId
    );
    return sum + myPayouts.reduce((s, p) => s + (p.amount || 0), 0);
  }, 0);
  const remainingWalletBalance = Math.max(0, releasedVal - totalPaidByCompany);

  // Build commBreakdown from FULL tree (direct + downline)
  // rowEligible and isDirectSale are FROZEN at commission lock time (from DB) — not re-evaluated dynamically
  const commBreakdown = allTreeSales.reduce((acc, c) => {
    const dist = (c.commissionDistribution || []).find(d => {
      const did = (d.advisor?._id || d.advisor || '').toString();
      return did === myId;
    });
    if (!dist) return acc;

    // Use frozen flags from DB if available; fall back to legacy logic for old records
    const isDirectSale = dist.isDirectSale !== undefined
      ? dist.isDirectSale
      : myDirectCustomerIds.has((c._id || c.id || '').toString());
    const rowEligible = dist.eligible !== undefined
      ? dist.eligible
      : (isDirectSale ? true : isEligible); // legacy fallback

    // For ineligible rows: if earnedAmount=0 (old DB record), estimate potential
    // New DB records will have the correct potential stored from the backend fix
    let earned = dist.earnedAmount || 0;
    let percent = dist.percent || 0;
    if (!rowEligible && earned === 0 && !isDirectSale) {
      // Estimate: upline standard rate is 2% (standard for slabs ≤13%)
      percent = 2;
      earned = (c.finalAmount || 0) * 0.02;
    }

    acc.push({
      name: c.name || '—',
      status: (c.status || 'WAITING').toUpperCase(),
      date: c.bookingDate || c.actualDate || c.registrationDate,
      saleAmount: c.finalAmount || 0,
      percent,
      earned,
      released: dist.releasedAmount || 0,
      pending: Math.max(0, earned - (dist.releasedAmount || 0)),
      isDirectSale,
      rowEligible,
    });
    return acc;
  }, []);




  // Monthly performance: count ONLY own/direct customers (not downline)
  const myOwnCustomers = data?.customers || [];
  const monthLeadsTotal = myOwnCustomers.filter(c => {
    const d = new Date(c.actualDate);
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  });
  // Closed sale = BOOKED for ALL payment modes
  const monthSalesCompleted = monthLeadsTotal.filter(c => {
    const status = (c.status || '').toUpperCase();
    return ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(status);
  });
  const monthSuccessRate = monthLeadsTotal.length > 0
    ? ((monthSalesCompleted.length / monthLeadsTotal.length) * 100).toFixed(1)
    : "0.0";

  // Full-tree sales filtered by selected month (for team monthly sales calc)
  const allTreeMonthlySales = allTreeSales.filter(c => {
    const d = new Date(c.actualDate);
    const status = (c.status || '').toUpperCase();
    return d.getMonth() === selMonth && d.getFullYear() === selYear &&
      ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(status);
  });

  const monthIncentive = getIncentiveDetails(data, allTreeAdvisors, allTreeMonthlySales);


  const getRowClass = (rowRate) => {
    if (rate === rowRate) {
      return "bg-blue-600/10 border-l-8 border-blue-600 animate-pulse font-black text-blue-900 shadow-xl relative z-20 scale-[1.02] transition-all";
    }
    return "hover:bg-gray-50 opacity-60 grayscale-[0.2]";
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 mt-16 font-sans">
      <div className="max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-white border border-gray-100">
        
        {/* TOP BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-center items-center text-slate-800">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200">
              <img 
                src={data.profilePhoto || Profile} 
                alt="Advisor Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-lg font-black tracking-wide text-slate-700 uppercase">{data.name}</span>
          </div>
        </div>
        
        {/* REWARD STRIP (MARQUEE) */}
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(50vw); }
              100% { transform: translateX(-150%); }
            }
            .animate-marquee {
              display: inline-block;
              animation: marquee 30s linear infinite;
            }
            .animate-marquee:hover {
               animation-play-state: paused;
            }
          `}
        </style>
        <div className="w-full bg-indigo-50 text-indigo-700 border-b border-indigo-100 shadow-sm py-2 overflow-hidden flex items-center h-10">
           <div className="animate-marquee whitespace-nowrap text-sm font-bold tracking-wider" style={{ display: 'inline-block', width: '200%' }}>
              {slabThresholds.slice(1).map((slab, i) => {
                 let status = '';
                 let color = '';
                  if (totalBus >= slab.tTotal && selfBus >= slab.tSelf) {
                      status = '✅ EARNED';
                      color = 'text-emerald-600';
                  } else if (i === rewardIndex) { 
                      status = '⏳ UPCOMING';
                      color = 'text-amber-600 animate-pulse';
                  } else {
                      return null; // Hide locked rewards
                  }
                  return (
                    <span key={i} className={`mx-8 ${color}`}>
                       {slab.name} {slab.emoji} <span className="text-[10px] font-black tracking-widest bg-white/60 border border-current px-2 py-0.5 rounded ml-1">{status}</span>
                    </span>
                  );
               })}
               {/* Duplicate array for seamless continuous loop */}
               <span className="mx-8 font-black opacity-20">|</span>
               {slabThresholds.slice(1).map((slab, i) => {
                  let status = '';
                  let color = '';
                  if (totalBus >= slab.tTotal && selfBus >= slab.tSelf) {
                      status = '✅ EARNED';
                      color = 'text-emerald-600';
                  } else if (i === rewardIndex) { 
                      status = '⏳ UPCOMING';
                      color = 'text-amber-600 animate-pulse';
                  } else {
                      return null; // Hide locked rewards
                  }
                  return (
                    <span key={'dup'+i} className={`mx-8 ${color}`}>
                       {slab.name} {slab.emoji} <span className="text-[10px] font-black tracking-widest bg-white/60 border border-current px-2 py-0.5 rounded ml-1">{status}</span>
                    </span>
                 );
              })}
           </div>
        </div>

        {/* METRIC CARDS */}
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm border border-slate-200 transform transition-transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="bg-orange-50 p-3 rounded-xl text-orange-500 mr-4 shrink-0 transition-transform group-hover:scale-110">
                <RiMoneyRupeeCircleLine size={28} />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">TOTAL EARNINGS</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-slate-800">₹{incentive.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm border border-slate-200 transform transition-transform hover:-translate-y-1">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-500 mr-4">
                <RiBarChartFill size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Sales (Team+Self)</p>
                <p className="text-2xl font-black text-slate-800">₹{totalBus.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm border border-slate-200 transform transition-transform hover:-translate-y-1">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-500 mr-4">
                <RiPercentLine size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Active Commission</p>
                <p className="text-2xl font-black text-indigo-600">{rate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm border border-slate-200 transform transition-transform hover:-translate-y-1">
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500 mr-4">
                <RiMedalFill size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Personal T&C Vol</p>
                <p className="text-2xl font-black text-emerald-600">₹{selfBus.toLocaleString('en-IN')}</p>
              </div>
            </div>

          </div>
        </div>

        {/* EARNING BANNER */}
        <div className="p-6 pb-0">
          <div 
            className="group bg-indigo-50 border border-indigo-100 rounded-2xl py-4 text-center text-indigo-900 shadow-sm flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-wider text-indigo-600">₹{incentive.toLocaleString('en-IN')}</span>
              <span className="text-sm font-black opacity-60 uppercase tracking-widest text-indigo-500">Total Released Commission</span>
            </div>
            <p className="text-[10px] mt-1 font-bold opacity-60 uppercase tracking-[0.2em] text-indigo-400">Based on Lifetime Performance Slabs</p>
          </div>
        </div>

        {/* DASHBOARD MIDDLE SECTION - GOALS & REWARDS */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Rewards Column */}
          <div className="bg-white rounded-2xl shadow-sm p-6 col-span-1 border border-slate-200 self-start">
            <h3 className="text-slate-800 font-black border-b border-slate-100 pb-3 mb-4 flex items-center text-sm uppercase tracking-widest">
              <span className="mr-2">🎁</span> Rewards Tracker
            </h3>
            <ul className="space-y-3 font-semibold text-sm max-h-96 overflow-y-auto pr-2">
              {slabThresholds.slice(1).map((slab, i) => {
                 // Rewards require BOTH team total AND self T&C to be met
                 let isRewardEarned = totalBus >= slab.tTotal && selfBus >= slab.tSelf;
                 let isRewardUpcoming = i === rewardIndex && isEligible;
                 
                 if (isRewardEarned) {
                   return (
                     <li key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 bg-emerald-50/50 px-3 py-2 rounded-xl text-emerald-800 border-l-4 border-l-emerald-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                       <span className="flex items-center font-bold text-xs"><span className="text-xl mr-3">{slab.emoji}</span> {slab.name}</span>
                       <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase font-black text-[10px] tracking-widest">Earned</span>
                     </li>
                   );
                 } else if (isRewardUpcoming) {
                   return (
                     <li key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 bg-blue-50/50 px-3 py-2 rounded-xl border-l-4 border-l-blue-400">
                       <span className="flex items-center text-slate-700 font-bold text-xs"><span className="text-xl mr-3">{slab.emoji}</span> {slab.name}</span>
                       <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase font-black text-[10px] tracking-widest animate-pulse">Upcoming</span>
                     </li>
                   );
                 } else {
                   return (
                     <li key={i} className="flex items-center justify-between p-2 border-b border-slate-50 opacity-60">
                       <span className="flex items-center text-slate-500 text-xs font-bold"><span className="text-xl mr-3 grayscale opacity-60">{slab.emoji}</span> {slab.name}</span>
                       <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase font-black text-[10px] tracking-widest border border-slate-200">Locked</span>
                     </li>
                   );
                 }
              })}
            </ul>
          </div>

          {/* DUAL Progress Column */}
          <div className="col-span-1 md:col-span-2 flex flex-col justify-start px-4 md:px-8 bg-white border border-gray-100 rounded-xl shadow py-6 relative overflow-hidden">
            {/* MOTIVATIONAL GLOW BANNER */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5 mb-6 text-center shadow-sm relative overflow-hidden group">
               <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-yellow-400 opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
               <div className="relative">
                 <p className="text-orange-600 font-extrabold uppercase tracking-widest text-[10px] mb-2">🔥 Next Reward Unlock 🔥</p>
                 <h3 className="text-yellow-900 font-black text-2xl md:text-3xl mb-1">{currentTargetObj.name} {currentTargetObj.emoji}</h3>

                 
                 {(deltaTotal > 0 || deltaSelf > 0) ? (
                   <div className="bg-white/90 rounded-lg p-3 inline-block shadow-sm border border-yellow-100 mb-2">
                      <p className="text-gray-800 font-bold text-sm">
                        You need just {" "}
                        {deltaTotal > 0 && <span className="text-blue-600 font-black">{formatCurrency(deltaTotal)} (Team)</span>}
                        {deltaTotal > 0 && deltaSelf > 0 && <span className="text-gray-400 mx-1">and</span>}
                        {deltaSelf > 0 && <span className="text-green-600 font-black">{formatCurrency(deltaSelf)} (Self)</span>}
                        {" "}more sales to win this! 🚀
                      </p>
                   </div>
                 ) : (
                   <div className="bg-green-100 rounded-lg p-3 inline-block shadow-sm mb-2">
                      <p className="text-green-800 font-black text-sm uppercase tracking-wider">🎉 Target completely met! 🎉</p>
                   </div>
                 )}
                 <div className="w-full"></div>
                 {!isMaxComm && (deltaCommTotal > 0 || deltaCommSelf > 0) && (
                   <div className="bg-white/90 rounded-lg p-3 inline-block shadow-sm border border-orange-200">
                      <p className="text-gray-800 font-bold text-sm">
                        You need just {" "}
                        {deltaCommTotal > 0 && <span className="text-blue-600 font-black">{formatCurrency(deltaCommTotal)} (Team)</span>}
                        {deltaCommTotal > 0 && deltaCommSelf > 0 && <span className="text-gray-400 mx-1">and</span>}
                        {deltaCommSelf > 0 && <span className="text-green-600 font-black">{formatCurrency(deltaCommSelf)} (Self)</span>}
                        {" "}more sales to unlock {nextCommObj.comm}% slab! 📈
                      </p>
                   </div>
                 )}
               </div>
            </div>
            
            {/* BAR 1: TOTAL BUSINESS */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-1">
                <p className="text-sm font-bold text-blue-900 uppercase tracking-widest">Team Total Constraint</p>
                <p className="text-sm font-bold text-gray-600">{formatCurrency(totalBus)} <span className="text-gray-400 font-normal">/ {formatCurrency(currentTargetObj.tTotal)}</span></p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden flex">
                <div className="bg-gradient-to-r from-blue-400 to-blue-700 h-4 rounded-full transition-all duration-1000" style={{ width: `${pTotalPercent}%` }}></div>
              </div>
              {deltaTotal > 0 ? (
                <p className="text-xs text-red-500 font-semibold mt-1.5 flex justify-end">Requires {formatCurrency(deltaTotal)} more total sales</p>
              ) : (
                <p className="text-xs text-green-600 font-bold mt-1.5 flex justify-end">Requirement Met! ✓</p>
              )}
            </div>

            {/* BAR 2: SELF BUSINESS T&C */}
            <div className="mb-2">
              <div className="flex justify-between items-end mb-1">
                <p className="text-sm font-bold text-green-700 uppercase tracking-widest">Self T&C Constraint</p>
                <p className="text-sm font-bold text-gray-600">{formatCurrency(selfBus)} <span className="text-gray-400 font-normal">/ {formatCurrency(currentTargetObj.tSelf)}</span></p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden flex">
                <div className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${pSelfPercent}%` }}></div>
              </div>
              {deltaSelf > 0 ? (
                <p className="text-xs text-red-500 font-semibold mt-1.5 flex justify-end">Requires {formatCurrency(deltaSelf)} more personal sales</p>
              ) : (
                <p className="text-xs text-green-600 font-bold mt-1.5 flex justify-end">Requirement Met! ✓</p>
              )}
            </div>
          </div>
        </div>
        {/* --- MONTHLY PERFORMANCE DASHBOARD --- */}
        <div className="px-6 mt-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-md">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center">
                <span className="mr-3 text-xl">📅</span> Monthly Performance
              </h3>
              <div className="flex gap-3 items-center">
                  <select 
                    value={selMonth} 
                    onChange={e => setSelMonth(Number(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold bg-white outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
                  >
                    {[...Array(12).keys()].map(m => (
                      <option key={m} value={m}>{new Date(2000, m).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select 
                    value={selYear} 
                    onChange={e => setSelYear(Number(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold bg-white outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
                  >
                    {[now.getFullYear(), now.getFullYear() + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
              </div>
            </div>
            
            <div className="p-6">
              {/* Monthly Performance Summary - Leads/Sales/Ratio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                 <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Customers</p>
                   <p className="text-4xl font-black text-slate-800 mb-1">{monthLeadsTotal.length}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Active Customers</p>
                 </div>

                 <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-sm">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Sales Completed</p>
                   <p className="text-4xl font-black text-blue-700 mb-1">{monthSalesCompleted.length}</p>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-tight">Booked & Registered</p>
                 </div>

                 <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-sm">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Success Rate</p>
                   <p className="text-4xl font-black text-emerald-600 mb-1">{monthSuccessRate}%</p>
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">Overall Closing Chance</p>
                 </div>
              </div>

              {/* WALLET & PAYOUT STATUS (LIFETIME) */}
              <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-100 mb-8 shadow-sm">
                <h3 className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-4">💳 Lifetime Wallet & Payout Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Released</p>
                    <p className="text-3xl font-black text-emerald-700">₹{releasedVal.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase text-center">Total commission cleared for payout</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Company Paid</p>
                    <p className="text-3xl font-black text-blue-700">₹{totalPaidByCompany.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase text-center">Amount disbursed to you</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Remaining Balance</p>
                    <p className="text-3xl font-black text-orange-600">₹{remainingWalletBalance.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase text-center">Owed by company</p>
                  </div>
                </div>
              </div>

              {/* Monthly Tracking Breakdown */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">

                {/* LOCKED EARNED — filtered by month + eligibility gate */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-3 text-center shadow-sm flex-1 min-w-[150px] relative">
                   <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mb-1">Locked Earned</p>
                   <p className="text-xl font-black text-indigo-700">₹{(isEligible ? (monthIncentive.grandTotal || 0) : 0).toLocaleString('en-IN')}</p>
                   <button
                     onClick={() => setShowEarnedTip(true)}
                     className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 text-xs font-black flex items-center justify-center hover:bg-indigo-300 transition-colors"
                   >i</button>
                </div>

                {/* TOTAL RELEASED — filtered by month + eligibility gate */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-3 text-center shadow-sm flex-1 min-w-[150px] relative">
                   <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Total Released</p>
                   <p className="text-xl font-black text-emerald-700">₹{(isEligible ? (monthIncentive.releasedTotal || 0) : 0).toLocaleString('en-IN')}</p>
                   <button
                     onClick={() => setShowReleasedTip(true)}
                     className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 text-xs font-black flex items-center justify-center hover:bg-emerald-300 transition-colors"
                   >i</button>
                </div>

                {/* PENDING — eligibility gate */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-6 py-3 text-center shadow-sm flex-1 min-w-[150px] relative">
                   <p className="text-xs text-orange-700 font-extrabold uppercase tracking-widest mb-1">Pending</p>
                   <p className="text-2xl font-black text-orange-600">₹{isEligible ? Math.max(0, (monthIncentive.grandTotal || 0) - (monthIncentive.releasedTotal || 0)).toLocaleString('en-IN') : '0'}</p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              
              <div className="bg-white rounded-2xl p-5 flex items-center shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform cursor-default">
                <div className="bg-green-100 text-green-700 w-14 h-14 flex items-center justify-center rounded-full mr-5 shadow-inner">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-1">Monthly Earned Commission</p>
                  <p className="text-3xl font-extrabold text-green-700">{isEligible ? inr(monthIncentive.grandTotal) : '₹0'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 flex items-center shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform cursor-default">
                <div className="bg-purple-100 text-purple-700 w-14 h-14 flex items-center justify-center rounded-full mr-5 shadow-inner">
                  <span className="text-2xl">🧍</span>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-1">Self Monthly Sales</p>
                  <p className="text-3xl font-extrabold text-purple-700">
                     {formatCurrency(monthIncentive.myDirectSales.reduce((sum, s) => sum + (s.finalAmount || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 flex items-center shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform cursor-default">
                <div className="bg-blue-100 text-blue-700 w-14 h-14 flex items-center justify-center rounded-full mr-5 shadow-inner">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-1">Team Monthly Sales</p>
                   <p className="text-3xl font-extrabold text-blue-700">
                     {formatCurrency(monthIncentive.teamBreakdown.reduce((sum, t) => sum + (t.totalVolume || 0), 0))}
                   </p>
                </div>
              </div>
            </div>

            </div>
          </div>
        </div>

        {/* --- PENDING PAYMENT TRACKER --- */}
        {(() => {
          const myId = data?._id || '';
          const pendingAll = (data?.customers || []).filter(c => {
            const status = (c.status || '').toUpperCase();
            return ['BOOKED', 'REGISTERED', 'PENDING_REGISTRATION'].includes(status);
          });
          // Sort: pending first, then paid
          pendingAll.sort((a, b) => {
            const balA = (a.finalAmount || 0) - (a.amountPaid || 0);
            const balB = (b.finalAmount || 0) - (b.amountPaid || 0);
            return balB - balA;
          });
          if (pendingAll.length === 0) return null;
          return (
            <PendingEmiSection customers={pendingAll} myId={myId} />
          );
        })()}

        {/* --- FULL BUSINESS PLAN TABLE REFERENCE --- */}
        <div className="p-6 pt-0 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center">
                <span className="mr-3 text-xl">📈</span> Full Business Plan 
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">T&C (SELF) represents personal sales required.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-black">Level</th>
                    <th className="px-6 py-4 font-black">Total Business (Team)</th>
                    <th className="px-6 py-4 text-center font-black">Commission</th>
                    <th className="px-6 py-4 font-black">T&C (Self)</th>
                    <th className="px-6 py-4 font-black">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold bg-white">
                  <tr className={getRowClass(5)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 5 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       1
                    </td>
                    <td className="px-6 py-4">0 - 5 LAC</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">5%</td>
                    <td className="px-6 py-4">5 LAC</td>
                    <td className="px-6 py-4 text-gray-900">MOBILE / 10K</td>
                  </tr>
                  <tr className={getRowClass(7)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 7 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       2
                    </td>
                    <td className="px-6 py-4">5 - 25 LAC</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">7%</td>
                    <td className="px-6 py-4">10 LAC</td>
                    <td className="px-6 py-4 text-gray-900">REFRIGERATOR / 25K</td>
                  </tr>
                  <tr className={getRowClass(9)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 9 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       3
                    </td>
                    <td className="px-6 py-4">25 - 50 LAC</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">9%</td>
                    <td className="px-6 py-4">20 LAC</td>
                    <td className="px-6 py-4 text-gray-900">SCOOTY / 50K</td>
                  </tr>
                  <tr className={getRowClass(11)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 11 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       4
                    </td>
                    <td className="px-6 py-4">50 LAC - 1 CR</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">11%</td>
                    <td className="px-6 py-4">35 LAC</td>
                    <td className="px-6 py-4 text-gray-900">i10 / 3 LAC</td>
                  </tr>
                  <tr className={getRowClass(13)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 13 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       5
                    </td>
                    <td className="px-6 py-4">1 - 5 CR</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">13%</td>
                    <td className="px-6 py-4">50 LAC</td>
                    <td className="px-6 py-4 text-gray-900">XUV-300 / 5 LAC</td>
                  </tr>
                  <tr className={getRowClass(14)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 14 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       6
                    </td>
                    <td className="px-6 py-4">5 - 10 CR</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">14%</td>
                    <td className="px-6 py-4">75 LAC</td>
                    <td className="px-6 py-4 text-gray-900">NEXON / 10 LAC</td>
                  </tr>
                  <tr className={getRowClass(15)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 15 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       7
                    </td>
                    <td className="px-6 py-4">10 - 25 CR</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">15%</td>
                    <td className="px-6 py-4">1 CR</td>
                    <td className="px-6 py-4 text-gray-900">XUV-700 / 25 LAC</td>
                  </tr>
                  <tr className={getRowClass(16)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 16 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       8
                    </td>
                    <td className="px-6 py-4">25 - 55 CR</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">16%</td>
                    <td className="px-6 py-4">2 CR</td>
                    <td className="px-6 py-4 text-gray-900">FORTUNER / 50LAC</td>
                  </tr>
                  <tr className={getRowClass(17)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 17 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       9
                    </td>
                    <td className="px-6 py-4">55 - 110 CR</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700">17%</td>
                    <td className="px-6 py-4">5 CR</td>
                    <td className="px-6 py-4 text-gray-900">BMW / 75LAC</td>
                  </tr>
                  <tr className={getRowClass(18)}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {rate === 18 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">CURRENT</span>}
                       10
                    </td>
                    <td className="px-6 py-4 text-green-700">110 CR +</td>
                    <td className="px-6 py-4 text-center font-bold text-green-700">18%</td>
                    <td className="px-6 py-4 text-green-700">10 CR</td>
                    <td className="px-6 py-4 font-bold text-green-600">DEFENDER / 1 CR</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* ═══ LOCKED EARNED BREAKDOWN MODAL ═══ */}
    {showEarnedTip && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowEarnedTip(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50 rounded-t-2xl">
            <div>
              <h3 className="text-base font-black text-indigo-800 uppercase tracking-wider">🔒 Locked Earned — Full Breakdown</h3>
              <p className="text-xs text-indigo-500 font-medium mt-0.5">Commission locked against each lead based on your slab at booking time.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-700">₹{earnedVal.toLocaleString('en-IN')}</p>
              <button onClick={() => setShowEarnedTip(false)} className="text-xs text-indigo-400 hover:text-indigo-700 font-bold mt-1">✕ Close</button>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-auto flex-1">
            {commBreakdown.length === 0 ? (
              <p className="text-center text-gray-400 italic py-16">No commission distribution data available yet.</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">Lead Name</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-center">Source</th>
                    <th className="px-5 py-3 text-right">Sale Amount</th>
                    <th className="px-5 py-3 text-center">Comm %</th>
                    <th className="px-5 py-3 text-right text-indigo-600">Locked Earned</th>
                    <th className="px-5 py-3 text-right text-emerald-600">Released</th>
                    <th className="px-5 py-3 text-right text-orange-500">Pending</th>
                    <th className="px-3 py-2.5 text-center">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commBreakdown.map((row, i) => (
                    <tr key={i} className={`transition-colors ${row.rowEligible ? 'hover:bg-indigo-50/30' : 'bg-red-50/30 opacity-60 hover:bg-red-50/50 hover:opacity-80'}`}>
                      <td className="px-3 py-2.5 font-bold text-gray-800">{row.name}</td>
                      {/* Status — hidden for ineligible downline */}
                      <td className="px-3 py-2.5">
                        {row.rowEligible ? (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            row.status === 'REGISTERED' ? 'bg-purple-100 text-purple-700' :
                            row.status === 'BOOKED' ? 'bg-yellow-100 text-yellow-700' :
                            row.status === 'PENDING_REGISTRATION' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{row.status}</span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      {/* Date — hidden for ineligible */}
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {row.rowEligible ? fmt(row.date) : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Source badge — always visible */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          row.isDirectSale ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>{row.isDirectSale ? 'Direct' : 'Downline'}</span>
                      </td>
                      {/* Sale Amount — hidden for ineligible */}
                      <td className="px-3 py-2.5 text-right font-bold text-gray-700">
                        {row.rowEligible ? `₹${row.saleAmount.toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Comm % — hidden for ineligible */}
                      <td className="px-3 py-2.5 text-center font-black text-blue-600">
                        {row.rowEligible ? `${row.percent}%` : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Locked Earned — always shown; red strikethrough if not eligible */}
                      <td className={`px-3 py-2.5 text-right font-black ${row.rowEligible ? 'text-indigo-700' : 'text-red-400 line-through italic'}`}>
                        ₹{row.earned.toLocaleString('en-IN')}
                      </td>
                      {/* Released — hidden for ineligible */}
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                        {row.rowEligible ? `₹${row.released.toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Pending — hidden for ineligible */}
                      <td className="px-3 py-2.5 text-right font-bold text-orange-500">
                        {row.rowEligible ? `₹${row.pending.toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Eligibility badge — always visible */}
                      <td className="px-3 py-2.5 text-center">
                        {row.rowEligible
                          ? <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Eligible ✓</span>
                          : <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Not Eligible</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr className="font-black text-sm">
                    <td className="px-3 py-2.5 text-gray-600" colSpan={6}>ELIGIBLE TOTAL</td>
                    <td className="px-3 py-2.5 text-right text-indigo-700">₹{commBreakdown.filter(r=>r.rowEligible).reduce((s,r)=>s+r.earned,0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600">₹{commBreakdown.filter(r=>r.rowEligible).reduce((s,r)=>s+r.released,0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right text-orange-500">₹{commBreakdown.filter(r=>r.rowEligible).reduce((s,r)=>s+r.pending,0).toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>

              </table>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ═══ TOTAL RELEASED BREAKDOWN MODAL ═══ */}
    {showReleasedTip && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowReleasedTip(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50 rounded-t-2xl">
            <div>
              <h3 className="text-base font-black text-emerald-800 uppercase tracking-wider">✅ Total Released — Full Breakdown</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Commission released proportionally as payments are received from each lead.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-700">₹{releasedVal.toLocaleString('en-IN')}</p>
              <button onClick={() => setShowReleasedTip(false)} className="text-xs text-emerald-400 hover:text-emerald-700 font-bold mt-1">✕ Close</button>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-auto flex-1">
            {commBreakdown.length === 0 ? (
              <p className="text-center text-gray-400 italic py-16">No commission distribution data available yet.</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                  <tr>
                    <th className="px-5 py-3">Lead Name</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Sale Amount</th>
                    <th className="px-5 py-3 text-center">Comm %</th>
                    <th className="px-5 py-3 text-right text-indigo-600">Locked</th>
                    <th className="px-5 py-3 text-right text-emerald-600">Released</th>
                    <th className="px-5 py-3 text-right">Release %</th>
                    <th className="px-5 py-3 text-center">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commBreakdown.map((row, i) => {
                    const releaseRatio = row.earned > 0 ? Math.round((row.released / row.earned) * 100) : 0;
                    return (
                      <tr key={i} className={`transition-colors ${row.rowEligible ? 'hover:bg-emerald-50/30' : 'bg-red-50/30 opacity-60 hover:bg-red-50/50'}`}>
                        <td className="px-5 py-3 font-bold text-gray-800">{row.name}</td>
                        <td className="px-5 py-3">
                          {row.rowEligible ? (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              row.status === 'REGISTERED' ? 'bg-purple-100 text-purple-700' :
                              row.status === 'BOOKED' ? 'bg-yellow-100 text-yellow-700' :
                              row.status === 'PENDING_REGISTRATION' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>{row.status}</span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {row.rowEligible ? fmt(row.date) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-700">
                          {row.rowEligible ? `₹${row.saleAmount.toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-center font-black text-blue-600">
                          {row.rowEligible ? `${row.percent}%` : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Locked — always shown; strikethrough if not eligible */}
                        <td className={`px-5 py-3 text-right font-bold ${row.rowEligible ? 'text-indigo-600' : 'text-red-400 line-through italic'}`}>
                          ₹{row.earned.toLocaleString('en-IN')}
                        </td>
                        {/* Released — always shown; strikethrough if not eligible */}
                        <td className={`px-5 py-3 text-right font-black ${row.rowEligible ? 'text-emerald-700' : 'text-red-400 line-through italic'}`}>
                          ₹{row.released.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {row.rowEligible ? (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                              releaseRatio >= 100 ? 'bg-emerald-100 text-emerald-700' :
                              releaseRatio > 0 ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-400'
                            }`}>{releaseRatio}%</span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {row.rowEligible
                            ? <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Eligible ✓</span>
                            : <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Not Eligible</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr className="font-black text-sm">
                    <td className="px-5 py-3 text-gray-600" colSpan={5}>ELIGIBLE TOTAL</td>
                    <td className="px-5 py-3 text-right text-indigo-600">₹{commBreakdown.filter(r=>r.rowEligible).reduce((s,r)=>s+r.earned,0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-right text-emerald-700">₹{commBreakdown.filter(r=>r.rowEligible).reduce((s,r)=>s+r.released,0).toLocaleString('en-IN')}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
}

export default IncentiveDashboard;

// ─── Pending EMI Section ──────────────────────────────────────────────────────
function PendingEmiSection({ customers, myId }) {
  const [selected, setSelected] = React.useState(null);
  const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
  const fmtDT = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    const date = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} · ${time}`;
  };
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-6 pt-0 mt-6">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
        {/* Header */}
        <div className="bg-orange-50 px-6 py-5 border-b border-orange-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest flex items-center">
              <span className="mr-3 text-xl">📋</span> Pending Payment Tracker
            </h3>
            <p className="text-xs text-orange-500 mt-0.5 font-medium">{customers.length} customer{customers.length !== 1 ? 's' : ''} with outstanding balance</p>
          </div>
        </div>

        {/* Customer List — max 4 rows visible, rest scrollable */}
        <div className="overflow-x-auto">
          <div className="max-h-[292px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
          <table className="w-full text-sm text-left">
            <thead className="bg-orange-50/50 text-orange-400 text-[10px] font-black uppercase tracking-widest border-b border-orange-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Plot</th>
                <th className="px-6 py-3 text-right">Total Amount</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-right text-orange-600">Pending</th>
                <th className="px-6 py-3 text-center">Mode / EMI</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {customers.map((c, i) => {
                const balance = (c.finalAmount || 0) - (c.amountPaid || 0);
                const paidPct = c.finalAmount > 0 ? Math.round(((c.amountPaid || 0) / c.finalAmount) * 100) : 0;
                return (
                  <tr key={i} className={`transition-colors ${ balance <= 0 ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'hover:bg-orange-50/30' }`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.status}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{c.projectName} · Plot {c.plotNumber}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">{inr(c.finalAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-emerald-600">{inr(c.amountPaid)}</p>
                      <p className="text-[10px] text-slate-400">{paidPct}% paid</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {balance <= 0
                        ? <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✅ Fully Paid</span>
                        : <span className="font-black text-orange-600">{inr(balance)}</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${ (c.paymentMode||'').toUpperCase()==='EMI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700' }`}>{c.paymentMode || '—'}</span>
                      {c.emi > 0 && <p className="text-xs font-bold text-slate-600 mt-1">₹{Number(c.emi).toLocaleString('en-IN')}/mo · {c.tenure}m</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setSelected(c)}
                        className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-lg text-xs uppercase tracking-widest transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>{/* /scroll-wrapper */}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white rounded-t-2xl flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black">Payment Details — {selected.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selected.projectName} · Plot {selected.plotNumber}{selected.tenure > 0 ? ` · ${selected.tenure} month${selected.paymentMode?.toUpperCase()==='EMI'?' EMI':''}` : ''}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl font-black">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-2xl font-black text-slate-800">{inr(selected.finalAmount)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-200 text-center">
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Received</p>
                  <p className="text-2xl font-black text-emerald-700">{inr(selected.amountPaid)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-orange-200 text-center">
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Pending</p>
                  <p className="text-2xl font-black text-orange-600">{inr((selected.finalAmount || 0) - (selected.amountPaid || 0))}</p>
                </div>
              </div>

              {/* Payment + Commission Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Payment & Commission Timeline</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Each payment shows commission released to you + any commission payout disbursed to you by the company on the same day</p>
                </div>
                {(!selected.payments || selected.payments.length === 0) ? (
                  <p className="p-6 text-sm text-slate-400 italic">No payments recorded yet.</p>
                ) : (() => {
                  // Find this advisor's commission distribution entry
                  const myDist = (selected.commissionDistribution || []).find(d => {
                    const did = (d.advisor?._id || d.advisor || '').toString();
                    return did === myId;
                  });
                  const totalEarned = myDist?.earnedAmount || 0;
                  const isEligible = myDist?.eligible !== false;

                  // Sort payments chronologically
                  const sortedPayments = [...selected.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
                  let cumulativePaid = 0;
                  let prevCommReleased = 0;

                  return (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-5 py-3">#</th>
                          <th className="px-5 py-3">Date &amp; Time</th>
                          <th className="px-5 py-3 text-right">Amount Received</th>
                          <th className="px-5 py-3 text-right text-indigo-500">Your Commission</th>
                          <th className="px-5 py-3 text-right text-yellow-600">Paid by Company</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sortedPayments.map((p, idx) => {
                          cumulativePaid += (p.amount || 0);
                          const ratio = selected.finalAmount > 0 ? cumulativePaid / selected.finalAmount : 0;
                          const cumComm = isEligible ? totalEarned * Math.min(ratio, 1) : 0;
                          const commThisPayment = Math.max(0, cumComm - prevCommReleased);
                          prevCommReleased = cumComm;
                          const paidPctHere = selected.finalAmount > 0 ? Math.round((cumulativePaid / selected.finalAmount) * 100) : 0;

                          // Payouts recorded by /dev for this advisor on this date
                          const payDate = new Date(p.date).toDateString();
                          const payoutsForDay = (selected.advisorPayouts || []).filter(b => {
                            const bAdv = (b.advisor?._id || b.advisor || '').toString();
                            return bAdv === myId && new Date(b.date).toDateString() === payDate;
                          });
                          const payoutTotal = payoutsForDay.reduce((s, b) => s + (b.amount || 0), 0);

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3 text-slate-400 font-bold text-xs">#{idx + 1}</td>
                              <td className="px-5 py-3">
                                <p className="font-medium text-slate-800 text-xs">{fmtDT(p.date)}</p>
                              </td>
                              <td className="px-5 py-3 text-right font-black text-emerald-600">{inr(p.amount)}</td>
                              <td className="px-5 py-3 text-right">
                                {isEligible ? (
                                  <span className="font-black text-indigo-600">{inr(commThisPayment)}</span>
                                ) : (
                                  <span className="text-xs text-red-400 line-through italic font-bold">{inr(totalEarned * Math.min(ratio,1) - (idx > 0 ? totalEarned * Math.min((cumulativePaid - p.amount) / (selected.finalAmount||1), 1) : 0))}</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right">
                                {payoutTotal > 0 ? (
                                  <span className="font-black text-yellow-600">{inr(payoutTotal)}</span>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr className="font-black text-sm">
                          <td colSpan={2} className="px-5 py-3 text-slate-600">TOTAL</td>
                          <td className="px-5 py-3 text-right text-emerald-700">{inr(cumulativePaid)}</td>
                          <td className="px-5 py-3 text-right text-indigo-600">{isEligible ? inr(prevCommReleased) : <span className="text-red-400 line-through text-xs">{inr(totalEarned)}</span>}</td>
                          <td className="px-5 py-3 text-right text-yellow-600">
                            {inr((selected.advisorPayouts || []).filter(b => (b.advisor?._id || b.advisor || '').toString() === myId).reduce((s,b) => s + (b.amount||0), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()}
              </div>

              {/* All Commission Payouts for this advisor */}
              {(() => {
                const myPayouts = (selected.advisorPayouts || []).filter(b =>
                  (b.advisor?._id || b.advisor || '').toString() === myId
                );
                const totalPaidByCompany = myPayouts.reduce((s,b) => s + (b.amount||0), 0);
                const myDist2 = (selected.commissionDistribution || []).find(d =>
                  (d.advisor?._id || d.advisor || '').toString() === myId
                );
                const commReleased = myDist2?.releasedAmount || 0;
                const balanceOwed = Math.max(0, commReleased - totalPaidByCompany);
                if (myPayouts.length === 0 && balanceOwed === 0) return null;
                return (
                  <div className="bg-yellow-50 rounded-xl border border-yellow-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50 flex justify-between items-center">
                      <h4 className="text-sm font-black text-yellow-800 uppercase tracking-wider">💰 Commission Payouts from Company</h4>
                      <div className="text-right">
                        <p className="text-xs text-yellow-600 font-bold">Commission Released: {inr(commReleased)}</p>
                        <p className="text-xs text-orange-600 font-black">Balance Owed to You: {inr(balanceOwed)}</p>
                      </div>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="text-yellow-600 text-[10px] font-black uppercase tracking-widest bg-yellow-50">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3 text-right">Paid by Company</th>
                          <th className="px-5 py-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-100">
                        {myPayouts.sort((a,b) => new Date(b.date)-new Date(a.date)).map((b, bi) => (
                          <tr key={bi} className="hover:bg-yellow-100/50">
                            <td className="px-5 py-3 text-slate-700 font-medium text-xs">{fmtDT(b.date)}</td>
                            <td className="px-5 py-3 text-right font-black text-yellow-700">{inr(b.amount)}</td>
                            <td className="px-5 py-3 text-xs text-slate-500 italic">{b.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
