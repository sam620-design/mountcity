import React, { useState, useEffect } from 'react';
import { bookCustomer, registerCustomer } from '../../services/advisorservice';
import { apiAdvisors } from '../../config/api.js';
import { useToast, useConfirm } from '../../context/AppProvider.jsx';

function CustomerDetails() {
  const toast = useToast();
  const confirm = useConfirm();
  const todayStr = new Date().toISOString().split('T')[0];
  const baseurl = apiAdvisors;
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal State triggers
  const [selectedBookCust, setSelectedBookCust] = useState(null);
  const [selectedRegCust, setSelectedRegCust] = useState(null);

  const [isAmountPaid, setIsAmountPaid] = useState(''); // 'Yes' or 'No'


  // --- BOOKING FORM STATE ---
  const [bBlock, setBBlock] = useState('A');
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
    // If EMI is picked, auto calculate (Remaining = Final - BookingAmount) / tenure
    if (bPaymentMode === 'EMI' && bTenure && Number(bTenure) > 0) {
      const remaining = finalAmt - (Number(bAmount) || 0);
      setBEmi((remaining / Number(bTenure)).toFixed(2));
    } else {
      setBEmi('');
    }
  }, [bPaymentMode, bTenure, bAmount, finalAmt]);

  useEffect(() => {
    // Block pricing logic auto-update
    switch (bBlock) {
      case 'A': setBPrice(1800); break;
      case 'B': setBPrice(2000); break;
      case 'C': setBPrice(2200); break;
      case 'D': setBPrice(2500); break;
      default: setBPrice('');
    }
  }, [bBlock]);

  const fetchCustomersList = async () => {
    const storedData = sessionStorage.getItem('advisorData');
    if (!storedData) return;
    const Data = JSON.parse(storedData);
    try {
      const response = await fetch(`${baseurl}/${Data.id}/customers`);
      if (response.ok) {
         const fetchedData = await response.json();
         const allowedStatuses = ['WAITING', 'BOOKED', 'REGISTERED', 'booked', 'waiting', 'PENDING_REGISTRATION'];
         const filtered = fetchedData.filter(c => allowedStatuses.includes(c.status?.toUpperCase()));
         setCustomers(filtered);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch Customers
  useEffect(() => {
    fetchCustomersList();
  }, [baseurl]);

  const openBookModal = (customer) => {
    setSelectedBookCust(customer);
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
        block: bBlock,
        price: bPrice,
        extraCharges: extChargesVal,
        baseAmount: baseAmt,
        finalAmount: finalAmt,
        bookingDate: bDate,
        bookingAmount: bAmount,
        paymentMode: bPaymentMode,
        tenure: bTenure,
        emi: bEmi
      };
      const res = await bookCustomer(selectedBookCust._id, payload);
      if (res.status === 201) {
        setCustomers((prev) => prev.map((c) => c._id === selectedBookCust._id ? { ...c, ...payload, status: 'BOOKED' } : c));
        setSelectedBookCust(null);
        toast.success(`${selectedBookCust.name} has been successfully BOOKED!`, 'Booking Confirmed');
      }
    } catch (err) {
      console.error(err);
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
        setCustomers((prev) => prev.map((c) => c._id === selectedRegCust._id ? { ...c, ...payload, status: 'PENDING_REGISTRATION' } : c));
        setSelectedRegCust(null);
        toast.success('Registration request submitted! Awaiting admin approval.', 'Registration Sent');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to register customer. Please try again.', 'Registration Failed');
    }
  };



  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const cStatus = customer.status?.toUpperCase() || 'WAITING';
    const matchesStatus = statusFilter === 'All' || cStatus === statusFilter.toUpperCase();
    
    // Date filter
    const cDate = new Date(customer.actualDate || customer.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const matchesDate = (!start || cDate >= start) && (!end || cDate <= end);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusUi = (status = '') => {
    const s = status.toUpperCase();
    switch (s) {
      case 'REGISTERED': return 'bg-purple-100 text-purple-800 border-purple-400';
      case 'PENDING_REGISTRATION': return 'bg-orange-100 text-orange-800 border-orange-400';
      case 'BOOKED': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'WAITING': return 'bg-gray-100 text-gray-800 border-gray-400';
      default: return 'bg-gray-100 text-gray-500 border-gray-400';
    }
  };

  return (
    <div className="mt-16 min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 py-4">Customer Details & Actions</h2>
        


        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="text-gray-700 font-bold mb-1 block text-sm">Search by Name</label>
            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
          <div>
            <label className="text-gray-700 font-bold mb-1 block text-sm">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
          <div>
            <label className="text-gray-700 font-bold mb-1 block text-sm">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((c) => {
            const sc = c.status?.toUpperCase() || 'WAITING';
            return (
            <div key={c._id} className="bg-white shadow-sm hover:shadow-md rounded-xl p-6 border border-gray-200 transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  sc === 'REGISTERED' ? 'bg-green-100 text-green-800' :
                  sc === 'PENDING_REGISTRATION' ? 'bg-orange-100 text-orange-800' :
                  sc === 'BOOKED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {sc}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2 mb-6 flex-grow">
                <p><strong>Phone:</strong> {c.phoneNumber}</p>
                <p><strong>Project:</strong> {c.projectName || 'N/A'}</p>
                <p><strong>Plot No:</strong> {c.plotNumber || 'N/A'}</p>
                
                {['BOOKED', 'REGISTERED', 'PENDING_REGISTRATION'].includes(sc) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-900"><strong>Amount Paid:</strong> ₹{c.amountPaid || c.bookingAmount || 0}</p>
                    <p className="text-gray-900"><strong>Total Price:</strong> ₹{c.finalAmount}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto space-y-3">
                
                {sc === 'WAITING' && (
                  <button onClick={() => openBookModal(c)} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    Book Property
                  </button>
                )}
                
                {sc === 'BOOKED' && (
                  <button onClick={() => openRegModal(c)} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors">
                    Close Deal
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* --- BOOKING MODAL --- */}
      {selectedBookCust && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Book Property for: {selectedBookCust.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Block (A/B/C/D)</label>
                <select value={bBlock} onChange={e => setBBlock(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100">
                  <option value="A">Block A</option>
                  <option value="B">Block B</option>
                  <option value="C">Block C</option>
                  <option value="D">Block D</option>
                </select>
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Price per sq.ft</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                   <input type="number" value={bPrice} onChange={e => setBPrice(e.target.value)} className="w-full p-3 pl-8 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Plot Size (sq.ft)</label>
                 <input type="number" value={bPlotSize} onChange={e => setBPlotSize(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Base Amount</label>
                 <div className="w-full p-3 border border-gray-300 rounded-xl bg-gray-100 font-bold text-gray-800">
                   ₹{baseAmt.toLocaleString('en-IN')}
                 </div>
              </div>
            </div>

            <div className="mb-5 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-3">Extra Charges</label>
              <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <label className="flex items-center text-sm"><input type="checkbox" className="mr-2 w-4 h-4" checked={exTwoSide} onChange={e=>setExTwoSide(e.target.checked)} /> 2 Side Road (+10%)</label>
                <label className="flex items-center text-sm"><input type="checkbox" className="mr-2 w-4 h-4" checked={exThreeSide} onChange={e=>setExThreeSide(e.target.checked)} /> 3 Side Road (+20%)</label>
                <label className="flex items-center text-sm"><input type="checkbox" className="mr-2 w-4 h-4" checked={ex25ft} onChange={e=>setEx25ft(e.target.checked)} /> 25ft Road (+10%)</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                 <label className="block text-sm font-bold text-indigo-700 mb-1">Total Price</label>
                 <div className="w-full p-3 border-2 border-indigo-500 rounded-xl bg-indigo-50 font-bold text-xl text-indigo-900">
                   ₹{finalAmt.toLocaleString('en-IN')}
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Booking Amount Paid</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                   <input type="number" value={bAmount} onChange={e => setBAmount(e.target.value)} className="w-full p-3 pl-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-100 outline-none" />
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Booking Date</label>
                 <input type="date" value={bDate} onChange={e => setBDate(e.target.value)} max={todayStr} className="w-full p-3 border border-gray-300 rounded-xl outline-none" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Payment Mode</label>
                 <select value={bPaymentMode} onChange={e => setBPaymentMode(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl outline-none">
                    <option value="Full Payment">Full Payment</option>
                    <option value="EMI">EMI</option>
                 </select>
              </div>
            </div>

            {bPaymentMode === 'EMI' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">EMI Term (Months)</label>
                   <input type="number" value={bTenure} onChange={e => setBTenure(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-900 mb-1">Monthly Payment</label>
                   <div className="w-full p-3 border border-gray-300 rounded-xl bg-white font-bold text-lg">
                     ₹{Number(bEmi).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                   </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setSelectedBookCust(null)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleBookSubmit} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md transition-colors">Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* --- REGISTRATION MODAL --- */}
      {selectedRegCust && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Close Deal: {selectedRegCust.name}</h3>
            <p className="text-sm text-gray-500 mb-6 pb-4 border-b">Sales commissions will be processed when you close this deal.</p>
            
            <div className="mb-5">
               <label className="block text-sm font-bold text-gray-700 mb-1">Closing Date</label>
               <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} max={todayStr} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" />
            </div>
            
            <div className="mb-6">
               <label className="block text-sm font-bold text-gray-700 mb-1">Total Price</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-lg">₹</span>
                 <input type="number" value={rFinalAmount} onChange={e => setRFinalAmount(e.target.value)} className="w-full p-3 pl-8 text-lg border-2 border-green-500 rounded-xl font-bold outline-none" />
               </div>
            </div>

            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
               <label className="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" checked={rAmountPaid} onChange={e => setRAmountPaid(e.target.checked)} className="w-5 h-5 text-orange-600 rounded border-orange-300 focus:ring-orange-500" />
                 <span className="text-sm font-bold text-orange-800">I confirm the full amount has been paid.</span>
               </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setSelectedRegCust(null)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
              <button onClick={handleRegSubmit} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md">Close Deal</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerDetails;
