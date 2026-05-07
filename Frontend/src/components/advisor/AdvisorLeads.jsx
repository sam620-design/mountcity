import React, { useState, useEffect } from 'react';
import { bookCustomer, registerCustomer } from '../../services/advisorservice';
import { apiAdvisors } from '../../config/api.js';
import { useToast, useConfirm } from '../../context/AppProvider.jsx';

function AdvisorLeads() {
  const toast = useToast();
  const confirm = useConfirm();
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for max date
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State triggers
  const [selectedBookCust, setSelectedBookCust] = useState(null);
  const [selectedRegCust, setSelectedRegCust] = useState(null);
  const [isAmountPaid, setIsAmountPaid] = useState('');

  // --- BOOKING FORM STATE ---
  const [bBlock, setBBlock] = useState('');
  const [bPrice, setBPrice] = useState('');
  const [bPlotSize, setBPlotSize] = useState('');
  
  const [exTwoSide, setExTwoSide] = useState(false);
  const [exThreeSide, setExThreeSide] = useState(false);
  const [ex25ft, setEx25ft] = useState(false);

  const [bDate, setBDate] = useState('');
  const [bAmount, setBAmount] = useState('');
  const [bPaymentMode, setBPaymentMode] = useState('Full Payment');
  const [bTenure, setBTenure] = useState('');
  const [bEmi, setBEmi] = useState('');

  // --- REGISTRATION FORM STATE ---
  const [rDate, setRDate] = useState('');
  const [rFinalAmount, setRFinalAmount] = useState('');
  const [rAmountPaid, setRAmountPaid] = useState(false);

  // --- DERIVED CALCULATIONS FOR BOOKING ---
  const baseAmt = (Number(bPlotSize) || 0) * (Number(bPrice) || 0);
  let extMod = 0;
  if (exTwoSide) extMod += 0.10;
  if (exThreeSide) extMod += 0.20;
  if (ex25ft) extMod += 0.10;
  const extChargesVal = baseAmt * extMod;
  const finalAmt = baseAmt + extChargesVal;

  useEffect(() => {
    // If EMI is picked, auto calculate
    if (bPaymentMode === 'EMI' && bTenure && Number(bTenure) > 0) {
      const remaining = finalAmt - (Number(bAmount) || 0);
      setBEmi((remaining / Number(bTenure)).toFixed(2));
    } else {
      setBEmi('');
    }
  }, [bPaymentMode, bTenure, bAmount, finalAmt]);

  useEffect(() => {
    switch (bBlock) {
      case 'A': setBPrice(1800); break;
      case 'B': setBPrice(2000); break;
      case 'C': setBPrice(2200); break;
      case 'D': setBPrice(2500); break;
      default: setBPrice('');
    }
  }, [bBlock]);

  useEffect(() => {
    const fetchLeads = async () => {
      const storedData = sessionStorage.getItem('advisorData');
      if (!storedData) return;
      const Data = JSON.parse(storedData);
      try {
        const response = await fetch(`${apiAdvisors}/${Data.id}/customers`);
        if (response.ok) {
          const fetchedData = await response.json();
          setLeads(fetchedData);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const openBookModal = (customer) => {
    setSelectedBookCust(customer);
    setBBlock('');
    setBPlotSize(customer.plotSize ? customer.plotSize.split(' ')[0] : '1200');
  };

  const openRegModal = (customer) => {
    setSelectedRegCust(customer);
    setRFinalAmount(customer.finalAmount || 0);
    setIsAmountPaid('');
  };

  const handleBookSubmit = async () => {
    if (!bBlock || !bPrice || !bPlotSize || !bDate || !bAmount || !bPaymentMode) {
      toast.error('All booking fields are mandatory.', 'Missing Fields');
      return;
    }

    if (bPaymentMode === 'EMI' && (!bTenure || bTenure <= 0 || !bEmi)) {
       toast.error('Tenure and EMI fields are mandatory when Payment Mode is EMI.', 'Missing Fields');
       return;
    }

    const ok = await confirm({
      title: 'Confirm Booking',
      message: `Are you sure you want to book this deal for ${selectedBookCust.name}? This will lock the pricing and structure.`,
      confirmText: 'Yes, Book',
      cancelText: 'Review Again',
    });
    if (!ok) return;

    try {
      const payload = {
        block: bBlock, price: bPrice, extraCharges: extChargesVal, baseAmount: baseAmt, finalAmount: finalAmt,
        bookingDate: bDate, bookingAmount: bAmount, paymentMode: bPaymentMode, tenure: bTenure, emi: bEmi
      };
      const res = await bookCustomer(selectedBookCust._id, payload);
      if (res.status === 201) {
        setLeads((prev) => prev.map((c) => c._id === selectedBookCust._id ? { ...c, ...payload, status: 'BOOKED' } : c));
        setSelectedBookCust(null);
        toast.success(`${selectedBookCust.name} has been successfully BOOKED!`, 'Booking Confirmed');
      }
    } catch (err) {
      toast.error('Failed to book customer. Please try again.', 'Booking Failed');
    }
  };

  const handleRegSubmit = async () => {
    if (!rDate || rFinalAmount === '') {
      toast.error('Registration Date and Final Settled Amount are mandatory.', 'Missing Fields');
      return;
    }
    if (!rAmountPaid) {
      toast.error('Registration cannot be completed unless the full amount is paid.', 'Payment Required');
      return;
    }

    const ok = await confirm({
      title: 'Submit Registration?',
      message: `Are you sure you want to submit registration for ${selectedRegCust.name}? Commission algorithms will execute upon admin approval.`,
      confirmText: 'Yes, Submit',
      cancelText: 'Review Again',
    });
    if (!ok) return;

    try {
      const payload = { 
        registrationDate: rDate, 
        finalAmount: rFinalAmount,
        isFullyPaid: rAmountPaid
      };
      const res = await registerCustomer(selectedRegCust._id, payload);
      if (res.status === 200) {
        setLeads((prev) => prev.map((c) => c._id === selectedRegCust._id ? { ...c, ...payload, status: 'PENDING_REGISTRATION' } : c));
        setSelectedRegCust(null);
        toast.success('Registration request submitted! Awaiting admin approval.', 'Registration Sent');
      }
    } catch (err) {
      toast.error('Failed to register customer. Please try again.', 'Registration Failed');
    }
  };

  // Helper to normalize the status string to ignore old DB states
  const getNormalizedStatus = (rawStatus = '') => {
    const s = rawStatus.toUpperCase();
    if (s === 'NOT-CONFIRMED' || s === 'WAITING' || !s) return 'WAITING';
    if (s === 'CONFIRMED' || s === 'REGISTERED') return 'REGISTERED';
    return s;
  };

  const renderStatusButton = (lead) => {
    const s = getNormalizedStatus(lead.status);
    if (s === 'REGISTERED') {
      return <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-xs font-extrabold shadow-sm">REGISTERED</span>;
    }
    if (s === 'BOOKED') {
      return (
        <button onClick={() => openRegModal(lead)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg text-xs font-extrabold shadow-md transition-colors cursor-pointer w-full">
          Click to Register
        </button>
      );
    }
    if (s === 'PENDING_REGISTRATION') {
      return (
        <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-xs font-extrabold shadow-sm w-full block text-center animate-pulse">
          Approval Pending
        </span>
      );
    }
    // WAITING
    return (
      <button onClick={() => openBookModal(lead)} className="bg-gray-200 hover:bg-blue-600 hover:text-white text-gray-800 px-4 py-2 rounded-lg text-xs font-extrabold shadow-md transition-colors cursor-pointer w-full">
        Waiting (Click to Book)
      </button>
    );
  };

  return (
    <div className="mt-16 min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-8 py-8 border-b border-gray-200">
             <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Your Customers</h2>
             <p className="text-gray-500 font-medium">Manage and book your added customers here.</p>
          </div>
          
          <div className="p-6 md:p-8 bg-white">

            {loading ? (
              <p className="text-center text-gray-500 py-10 italic">Loading...</p>
            ) : leads.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-lg">No customers found. Start adding customers!</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-200">
                      <th className="py-4 px-6 min-w-[200px]">Customer Name</th>
                      <th className="py-4 px-6 min-w-[200px]">Contact Info</th>
                      <th className="py-4 px-6 min-w-[200px]">Project Info</th>
                      <th className="py-4 px-6 text-center min-w-[200px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {leads.map((lead, idx) => (
                      <tr key={lead._id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900 text-base">{lead.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{lead.address || 'Address not added'}</div>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          <div className="font-semibold">{lead.phoneNumber}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{lead.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-900 font-semibold">{lead.projectName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Plot: {lead.plotNumber || 'Unassigned'}</div>
                        </td>
                        <td className="py-4 px-6 text-center align-middle">
                          {renderStatusButton(lead)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

       {/* --- BOOKING MODAL --- */}
      {selectedBookCust && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 border-b pb-2 text-blue-900">Booking Flow: {selectedBookCust.name}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plot No.</label>
                <input type="text" value={bBlock} onChange={e => setBBlock(e.target.value)} placeholder="Enter Plot No." className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Price per sq.ft</label>
                 <div className="relative">
                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                   <input type="number" value={bPrice} onChange={e => setBPrice(e.target.value)} className="w-full p-2 pl-6 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Plot Size (sq.ft)</label>
                 <input type="number" value={bPlotSize} onChange={e => setBPlotSize(e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-gray-50 outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Auto Base Amount</label>
                 <div className="w-full p-2 border border-gray-300 rounded bg-gray-200 font-bold text-gray-700">
                   ₹{baseAmt.toLocaleString('en-IN')}
                 </div>
              </div>
            </div>

            <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-2">Extra Charges</label>
              <div className="flex space-x-4 text-sm text-gray-700">
                <label className="flex items-center"><input type="checkbox" className="mr-2" checked={exTwoSide} onChange={e=>setExTwoSide(e.target.checked)} /> 2 Side Road (+10%)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" checked={exThreeSide} onChange={e=>setExThreeSide(e.target.checked)} /> 3 Side Road (+20%)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" checked={ex25ft} onChange={e=>setEx25ft(e.target.checked)} /> 25ft Road (+10%)</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                 <label className="block text-sm font-bold text-blue-700 mb-1">Final Amount</label>
                 <div className="w-full p-2 border-2 border-blue-600 rounded bg-blue-50 font-bold text-lg text-blue-900">
                   ₹{finalAmt.toLocaleString('en-IN')}
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Booking Amount Paid</label>
                 <div className="relative">
                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                   <input type="number" value={bAmount} onChange={e => setBAmount(e.target.value)} className="w-full p-2 pl-6 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none" />
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
                 <input type="date" value={bDate} onChange={e => setBDate(e.target.value)} max={todayStr} className="w-full p-2 border border-gray-300 rounded outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                 <select value={bPaymentMode} onChange={e => setBPaymentMode(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none">
                    <option value="Full Payment">Full Payment</option>
                    <option value="EMI">EMI</option>
                 </select>
              </div>
            </div>

            {bPaymentMode === 'EMI' && (
              <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months)</label>
                   <input type="number" value={bTenure} onChange={e => setBTenure(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-800 mb-1">Calculated Monthly EMI</label>
                   <div className="w-full p-2 border border-gray-300 rounded bg-white font-bold">
                     ₹{Number(bEmi).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                   </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 border-t pt-4">
              <button onClick={() => setSelectedBookCust(null)} className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold shadow">Cancel</button>
              <button onClick={handleBookSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg">Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* --- REGISTRATION MODAL --- */}
      {selectedRegCust && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-purple-800 border-b pb-2">Register Lead: <br/><span className="text-lg text-gray-600 font-normal">{selectedRegCust.name}</span></h3>
            <p className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-100 mb-6 font-semibold">
               Note: Commission algorithms will be executed universally upon this registration.
            </p>
            
            <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
               <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} max={todayStr} className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            
            <div className="mb-4 bg-purple-50/50 p-4 rounded-lg border border-purple-100">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                 <span className="text-gray-500">Total Received so far</span>
                 <span className="text-emerald-600">₹{(selectedRegCust.amountPaid || 0).toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                 <span className="text-gray-500">Remaining Balance</span>
                 <span className="text-orange-600">₹{Math.max(0, (Number(rFinalAmount) || 0) - (selectedRegCust.amountPaid || 0)).toLocaleString('en-IN')}</span>
               </div>
            </div>

            <div className="mb-6">
               <label className="block text-sm font-bold text-gray-800 mb-1">Final Settled Amount</label>
               <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-700 font-black text-xl">₹</span>
                 <input type="number" value={rFinalAmount} onChange={e => setRFinalAmount(e.target.value)} className="w-full p-3 pl-8 border-2 border-purple-600 rounded-lg font-bold text-xl outline-none bg-purple-50" />
               </div>
               {rFinalAmount && <p className="text-xs text-purple-500 font-semibold mt-1 tracking-tight">Updating final value to ₹{Number(rFinalAmount).toLocaleString('en-IN')}</p>}
            </div>

            <div className="mb-6 bg-red-50 p-4 border border-red-200 rounded-lg">
               <label className="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" checked={rAmountPaid} onChange={e => setRAmountPaid(e.target.checked)} className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500" />
                 <span className="text-sm font-bold text-red-800">I confirm the full amount has been paid.</span>
               </label>
            </div>


            <div className="flex justify-end space-x-4 border-t pt-4">
              <button onClick={() => setSelectedRegCust(null)} className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold shadow">Cancel</button>
              <button onClick={handleRegSubmit} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-lg">Submit Registration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvisorLeads;
