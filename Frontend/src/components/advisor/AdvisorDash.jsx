import React, { useEffect, useState } from 'react';
import { RiMedalFill, RiUserStarLine, RiPhoneLine, RiMailLine, RiBankCardLine, RiShieldCheckFill, RiArrowRightSLine, RiPieChart2Fill, RiMapPinLine, RiCameraLine, RiLoader4Line, RiCalendarLine, RiDropFill, RiContactsBookLine } from "react-icons/ri";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { Profile } from '..';
import { apiAdvisors } from '../../config/api.js';
import IdCardModal from './IdCardModal';

const AdvisorDash = () => {
  const [data, setData] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [showIdCardPrompt, setShowIdCardPrompt] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState('');
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [isEditingBloodGroup, setIsEditingBloodGroup] = useState(false);
  const [bloodGroupInput, setBloodGroupInput] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Generate trailing 6 month timeline
  const generateChartData = (customers) => {
    const dataPoints = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dataPoints.push({
        name: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        Leads: 0,
        Sales: 0
      });
    }

    if (!customers || !customers.length) return dataPoints;

    customers.forEach(c => {
      const createdDate = new Date(c.actualDate || Date.now());
      const m = createdDate.getMonth();
      const y = createdDate.getFullYear();
      
      const bin = dataPoints.find(dp => dp.month === m && dp.year === y);
      if (bin) {
        bin.Leads += 1;
        const status = (c.status || '').toUpperCase();
        const isClosedSale = ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(status);
        if (isClosedSale) bin.Sales += 1;
      }
    });

    return dataPoints;
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem('advisorData');
    if (storedData) {
      setData(JSON.parse(storedData));
    }

    const fetchFreshData = async () => {
      try {
        let currentLeads = data?.leads || (storedData ? JSON.parse(storedData).leads : 0);
        let currentSales = data?.sales || (storedData ? JSON.parse(storedData).sales : 0);
        
        // 1. Execute dynamic table computations regardless of token lifecycle!
        if (storedData) {
            try {
              const parseId = JSON.parse(storedData).id;
              const custRes = await fetch(`${apiAdvisors}/${parseId}/customers`);
              if (custRes.ok) {
                 const customers = await custRes.json();
                 currentLeads = customers.length;
                 currentSales = customers.filter(c => {
                   const status = (c.status || '').toUpperCase();
                   return ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(status);
                 }).length;
                 
                 // Immediately sync UI before full profile resolution
                 setData(prev => prev ? { ...prev, leads: currentLeads, sales: currentSales } : null);
                 setChartData(generateChartData(customers)); // Build historical graph
              }
            } catch(e) {}
        }

        const token = sessionStorage.getItem('token');
        if (!token) return;
        
        // 2. Fetch authenticated profile data
        const response = await fetch(`${apiAdvisors}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const freshData = await response.json();
          const mappedData = {
            ...freshData,
            id: freshData._id || freshData.id,
            leads: currentLeads,
            sales: currentSales,
            incentive: freshData.incentives || freshData.incentive,
            earned: freshData.totalCommissionEarned || freshData.incentives || 0,
            released: freshData.totalCommissionReleased || freshData.incentives || 0
          };
          setData(mappedData);
          sessionStorage.setItem('advisorData', JSON.stringify(mappedData));
        } else if (response.status === 401) {
           console.warn("Session token expired! Profile metrics cache retained for safety.");
        }
      } catch (err) {
        console.error("Failed to fetch live advisor metrics", err);
      }
    };
    fetchFreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          const token = sessionStorage.getItem('token');
          const res = await fetch(`${apiAdvisors}/${data.id}/profile`, {
             method: 'PUT',
             headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({ profilePhoto: base64String })
          });
          if (res.ok) {
             const result = await res.json();
             const updatedProfile = { ...data, profilePhoto: result.advisor.profilePhoto };
             setData(updatedProfile);
             sessionStorage.setItem('advisorData', JSON.stringify(updatedProfile));
          } else {
             alert('Failed to update profile photo. Session may have expired.');
          }
        } catch(err) { 
          console.error("Photo upload failed", err); 
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const submitAddress = async () => {
        try {
          const token = sessionStorage.getItem('token');
          const res = await fetch(`${apiAdvisors}/${data.id}/profile`, {
             method: 'PUT',
             headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({ address: addressInput })
          });
          if (res.ok) {
             const result = await res.json();
             const updatedProfile = { ...data, address: result.advisor.address };
             setData(updatedProfile);
             sessionStorage.setItem('advisorData', JSON.stringify(updatedProfile));
             setIsEditingAddress(false);
          } else {
             alert('Failed to update address. Session may have expired.');
          }
        } catch(err) { console.error(err); }
  }

  const submitBloodGroup = async () => {
        try {
          const token = sessionStorage.getItem('token');
          const res = await fetch(`${apiAdvisors}/${data.id}/profile`, {
             method: 'PUT',
             headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({ bloodGroup: bloodGroupInput })
          });
          if (res.ok) {
             const result = await res.json();
             const updatedProfile = { ...data, bloodGroup: result.advisor.bloodGroup };
             setData(updatedProfile);
             sessionStorage.setItem('advisorData', JSON.stringify(updatedProfile));
             setIsEditingBloodGroup(false);
          } else {
             alert('Failed to update blood group. Session may have expired.');
          }
        } catch(err) { console.error(err); }
  }

  const handleIdCardOk = () => {
     if (!emergencyInput || !/^\d{10}$/.test(emergencyInput)) {
        alert("Please enter a valid 10-digit emergency contact number.");
        return;
     }
     setShowIdCardPrompt(false);
     setShowIdCardModal(true);
  };

  const handleIdCardSkip = () => {
     setShowIdCardPrompt(false);
     setEmergencyInput('');
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3A62]"></div>
    </div>
  );

  // Recompute from own customers (live data) — matches Incentive.jsx logic exactly
  const ownCustomers = data.customers || [];
  const clientsAdded = ownCustomers.length;
  const leadsConverted = ownCustomers.filter(c => {
    const status = (c.status || '').toUpperCase();
    return ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(status);
  }).length;
  const successRate = clientsAdded > 0 ? ((leadsConverted / clientsAdded) * 100).toFixed(1) : 0;
  const incentiveVal = data.incentive || 0;

  // Self-Eligibility Gate (mirrors Incentive.jsx logic)
  const SLAB_THRESHOLDS = [
    { tTotal: 0,          tSelf: 0 },
    { tTotal: 500000,     tSelf: 500000 },
    { tTotal: 2500000,    tSelf: 1000000 },
    { tTotal: 5000000,    tSelf: 2000000 },
    { tTotal: 10000000,   tSelf: 3500000 },
    { tTotal: 50000000,   tSelf: 5000000 },
    { tTotal: 100000000,  tSelf: 7500000 },
    { tTotal: 250000000,  tSelf: 10000000 },
    { tTotal: 550000000,  tSelf: 20000000 },
    { tTotal: 1100000000, tSelf: 50000000 },
  ];
  const totalBus = data.totalBusiness || 0;
  const selfBus = data.selfBusiness || 0;
  let activeSlabIdx = 0;
  for (let i = 1; i < SLAB_THRESHOLDS.length; i++) {
    if (totalBus >= SLAB_THRESHOLDS[i].tTotal) activeSlabIdx = i;
    else break;
  }
  const requiredSelf = SLAB_THRESHOLDS[activeSlabIdx].tSelf;
  const isDashEligible = selfBus >= requiredSelf;

  const displayEarned   = isDashEligible ? (data.earned   || 0) : 0;
  const displayReleased = isDashEligible ? (data.released || 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 font-sans font-medium text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* TOP HERO PROFILE SECTION */}
        <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
          
          {/* Header Banner */}
          <div className="h-32 bg-slate-50 border-b border-slate-100 flex items-center px-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 text-slate-100 opacity-30 select-none pointer-events-none">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z"/></svg>
             </div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 hover:bg-white transition-colors">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between -mt-16 relative z-10">
              
              {/* Picture & Name Container */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                <div className="relative group cursor-pointer flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-sm bg-slate-100 overflow-hidden relative">
                    <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handlePhotoUpload} disabled={isUploading} />
                    <label htmlFor="photo-upload" className={`cursor-pointer w-full h-full block ${isUploading ? 'opacity-50' : ''}`}>
                      <img src={data.profilePhoto || Profile} alt="Advisor Profile" className="w-full h-full object-cover transform transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploading ? <RiLoader4Line size={28} className="text-slate-800 animate-spin" /> : <RiCameraLine size={28} className="text-slate-800" />}
                      </div>
                    </label>
                  </div>
                  <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg border-2 border-white shadow-sm z-20 
                    ${data?.badge === 'Platinum' ? 'bg-slate-300' : 
                      data?.badge === 'Gold' ? 'bg-amber-400' : 
                      data?.badge === 'Silver' ? 'bg-slate-300' : 
                      data?.badge === 'Bronze' ? 'bg-orange-500' : 'bg-indigo-600'} text-white`}>
                    <RiMedalFill size={16} />
                  </div>
                </div>
                
                {/* Name + ID + Badge */}
                <div className="text-center md:text-left flex-1 md:pb-2">
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{data.name}</h1>
                  <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
                    {data.advisorId && (
                      <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">ID: {data.advisorId}</p>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <RiShieldCheckFill className="mr-1" /> Verified
                    </span>
                    <button onClick={() => setShowIdCardPrompt(true)} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm ml-2">
                      <RiContactsBookLine className="mr-1.5" /> ID Card
                    </button>
                  </div>
                </div>

                {/* Earnings Summary Button Matrix */}
                <div className="flex gap-4 mt-6 md:mt-0 pb-2">
                   <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center min-w-[140px]">
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Earned</p>
                     <p className="text-xl font-black text-slate-800">₹{displayEarned.toLocaleString('en-IN')}</p>
                   </div>
                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3 text-center min-w-[140px] shadow-sm">
                     <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mb-1">Released</p>
                     <p className="text-xl font-black text-indigo-700">₹{displayReleased.toLocaleString('en-IN')}</p>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* METRICS & QUICK LINKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Main Info Left Column */}
          <div className="md:col-span-8 flex flex-col space-y-8">
            
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center transition-all hover:bg-slate-50 group cursor-pointer" onClick={() => window.location.href='/advisor/leads'}>
                 <div className="bg-sky-50 text-sky-500 p-4 rounded-xl mr-5">
                   <RiUserStarLine size={28} />
                 </div>
                 <div className="flex-1">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Leads</p>
                   <div className="flex justify-between items-end mt-1">
                     <p className="text-3xl font-black text-slate-800">{clientsAdded}</p>
                     <span className="text-sky-500 font-bold hover:text-sky-600 flex items-center text-xs uppercase tracking-wider">View All <RiArrowRightSLine /></span>
                   </div>
                 </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center transition-all hover:bg-slate-50 group cursor-pointer" onClick={() => window.location.href='/advisor/sales'}>
                 <div className="bg-emerald-50 text-emerald-500 p-4 rounded-xl mr-5">
                   <RiPieChart2Fill size={28} />
                 </div>
                 <div className="flex-1">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Closed Sales</p>
                   <div className="flex justify-between items-end mt-1">
                     <p className="text-3xl font-black text-slate-800">{leadsConverted}</p>
                     <span className="text-emerald-500 font-bold hover:text-emerald-600 flex items-center text-xs uppercase tracking-wider">View All <RiArrowRightSLine /></span>
                   </div>
                 </div>
              </div>
            </div>

            {/* Performance Matrices */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Performance Summary</h3>
               </div>
               <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                 
                 <div className="text-left p-4 rounded-xl bg-slate-50 border border-slate-100 relative">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Leads</p>
                    <p className="text-3xl font-black text-slate-800">{clientsAdded}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">All Customers Added</p>
                 </div>
                 
                 <div className="text-left p-4 rounded-xl bg-sky-50 border border-sky-100 relative">
                    <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mb-1">Closed Sales</p>
                    <p className="text-3xl font-black text-sky-700">{leadsConverted}</p>
                    <p className="text-[10px] text-sky-500/70 mt-2 font-bold uppercase tracking-wider">Booked & Registered</p>
                 </div>

                 <div className="text-left p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="text-3xl font-black text-emerald-700">{successRate}%</p>
                    <p className="text-[10px] text-emerald-500/70 mt-2 font-bold uppercase tracking-wider">Overall Closing Chance</p>
                 </div>

               </div>
               
               {/* Visual Progress Bar */}
               <div className="px-8 pb-6">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Success Rate</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${successRate}%` }}></div>
                  </div>
               </div>
            </div>

            {/* Performance Graph */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-6 flex justify-between items-center">
                <span>Past Performance</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{formatDate(data.date)} - Present</span>
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                       cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area type="monotone" dataKey="Leads" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                    <Area type="monotone" dataKey="Sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Right Sidebar - ADVISOR DETAILS */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 border-b border-slate-100 pb-2">Advisor Profile</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-indigo-500 p-1.5 rounded-md shadow-sm border border-slate-100">
                    <RiMailLine size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-slate-800 font-bold text-sm truncate">{data.email}</p>
                  </div>
                </li>
                
                <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-emerald-500 p-1.5 rounded-md shadow-sm border border-slate-100">
                    <RiPhoneLine size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Contact</p>
                    <p className="text-slate-800 font-bold text-sm">{data.phoneNumber}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-rose-500 p-1.5 rounded-md shadow-sm border border-slate-100 mt-1">
                    <RiMapPinLine size={16} />
                  </div>
                  <div className="w-full pr-1 shrink">
                    <div className="flex justify-between items-center mb-0.5">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</p>
                       <button onClick={() => { setIsEditingAddress(!isEditingAddress); setAddressInput(data.address || ''); }} className="text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">Edit</button>
                    </div>
                    {isEditingAddress ? (
                       <div className="mt-2 flex flex-col space-y-2">
                         <textarea 
                            value={addressInput} 
                            onChange={e => setAddressInput(e.target.value)} 
                            className="w-full border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 p-2 rounded-md text-sm text-slate-800 bg-white" 
                            rows={3} 
                            placeholder="Enter full address..."
                         />
                         <div className="flex justify-end space-x-2">
                           <button onClick={() => setIsEditingAddress(false)} className="text-slate-500 text-xs px-2 py-1 font-bold">Cancel</button>
                           <button onClick={submitAddress} className="bg-blue-600 text-white font-bold tracking-wider uppercase text-[10px] px-3 py-1.5 rounded shadow-sm">Save</button>
                         </div>
                       </div>
                    ) : (
                       <p className="text-slate-800 font-semibold text-xs leading-snug truncate whitespace-normal break-words">{data.address || 'Not Provided'}</p>
                    )}
                  </div>
                </li>

                <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-violet-500 p-1.5 rounded-md shadow-sm border border-slate-100">
                    <RiBankCardLine size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PAN ID</p>
                    <p className="text-slate-800 font-bold text-sm">{data.pan || 'Not Provided'}</p>
                  </div>
                </li>

                <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-orange-500 p-1.5 rounded-md shadow-sm border border-slate-100">
                    <RiShieldCheckFill size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar</p>
                    <p className="text-slate-800 font-bold text-sm">{data.aadhar || 'Not Provided'}</p>
                  </div>
                </li>

                <li className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-sky-500 p-1.5 rounded-md shadow-sm border border-slate-100">
                    <RiCalendarLine size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                    <p className="text-slate-800 font-bold text-sm">{formatDate(data.dob)}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="bg-white text-rose-500 p-1.5 rounded-md shadow-sm border border-slate-100 mt-1">
                    <RiDropFill size={16} />
                  </div>
                  <div className="w-full pr-1 shrink">
                    <div className="flex justify-between items-center mb-0.5">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                       <button onClick={() => { setIsEditingBloodGroup(!isEditingBloodGroup); setBloodGroupInput(data.bloodGroup || ''); }} className="text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">Edit</button>
                    </div>
                    {isEditingBloodGroup ? (
                       <div className="mt-2 flex flex-col space-y-2">
                         <input 
                            type="text"
                            value={bloodGroupInput} 
                            onChange={e => setBloodGroupInput(e.target.value)} 
                            className="w-full border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 p-2 rounded-md text-sm text-slate-800 bg-white" 
                            placeholder="e.g. O+, A-, B+"
                         />
                         <div className="flex justify-end space-x-2">
                           <button onClick={() => setIsEditingBloodGroup(false)} className="text-slate-500 text-xs px-2 py-1 font-bold">Cancel</button>
                           <button onClick={submitBloodGroup} className="bg-blue-600 text-white font-bold tracking-wider uppercase text-[10px] px-3 py-1.5 rounded shadow-sm">Save</button>
                         </div>
                       </div>
                    ) : (
                       <p className="text-slate-800 font-semibold text-xs leading-snug">{data.bloodGroup || 'Not Provided'}</p>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            {/* Performance Matrices Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Sales Breakdown</h3>
              <div className="h-52 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={[
                        { name: 'Converted', value: data.sales || 0 },
                        { name: 'Pending', value: Math.max(0, (data.leads || 0) - (data.sales || 0)) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell key="cell-0" fill="#0ea5e9" />
                      <Cell key="cell-1" fill="#cbd5e1" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#334155', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-5 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Converted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Pending</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Emergency Contact Prompt */}
      {showIdCardPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-6">
                 <h3 className="text-lg font-black text-slate-800 mb-2">Emergency Contact</h3>
                 <p className="text-sm text-slate-500 mb-4 leading-relaxed">Please enter an emergency contact number to be printed on the back of your ID card.</p>
                 <input 
                    type="text" 
                    value={emergencyInput}
                    onChange={(e) => {
                       const val = e.target.value.replace(/\D/g, '');
                       if (val.length <= 10) setEmergencyInput(val);
                    }}
                    placeholder="Enter 10-digit phone number..."
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-6 text-slate-800"
                 />
                 <div className="flex justify-end gap-3">
                    <button onClick={handleIdCardSkip} className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Skip</button>
                    <button onClick={handleIdCardOk} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm">OK</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIdCardModal && (
         <IdCardModal 
            data={data} 
            emergencyContact={emergencyInput} 
            onClose={() => { setShowIdCardModal(false); setEmergencyInput(''); }} 
         />
      )}
    </div>
  );
}

export default AdvisorDash;
