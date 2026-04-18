import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
const formatDate = (d) => {
  if (!d) return '—';
  try {
     return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
     return '—';
  }
};
const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    const date = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time };
  } catch (e) {
    return { date: '—', time: '' };
  }
};

function LedgerModal({ customer, onClose, isOwner }) {
  if (!customer) return null;

  return createPortal(
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center p-4 overflow-hidden" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 shrink-0 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Ledger & Commissions: {customer.name}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{customer.projectName} · Plot {customer.plotNumber}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
           {/* Financial Summary */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Final Amount</p>
                 <p className="text-2xl font-black text-slate-800">{formatCurrency(customer.finalAmount)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-xs text-green-500 font-bold uppercase tracking-wider mb-1">Amount Paid</p>
                 <p className="text-2xl font-black text-green-700">{formatCurrency(customer.amountPaid)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Balance Due</p>
                 <p className="text-2xl font-black text-orange-600">{formatCurrency(customer.finalAmount - customer.amountPaid)}</p>
              </div>
           </div>

           {/* Payment History */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Payment History</h3>
             </div>
             <div className="p-0">
               {(!customer.payments || customer.payments.length === 0) ? (
                 <p className="p-6 text-sm text-slate-500 italic">No payments recorded yet.</p>
               ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Date &amp; Time</th>
                        <th className="px-6 py-3">Note / Remarks</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...customer.payments].reverse().map((p, idx) => {
                        const dt = formatDateTime(p.date);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-3">
                              <p className="font-medium text-slate-800">{dt.date}</p>
                              {dt.time && <p className="text-xs text-slate-400">{dt.time}</p>}
                            </td>
                            <td className="px-6 py-3 text-slate-500 text-xs italic">{p.note || '—'}</td>
                            <td className="px-6 py-3 text-right font-black text-green-600">+{formatCurrency(p.amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               )}
             </div>
           </div>

           {/* Commission Breakdown */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Commission Splitting & Disbursement</h3>
                <p className="text-xs text-slate-500 mt-1">Commissions are incrementally released as payments are received from the customer based on real ratio.</p>
             </div>
             <div className="p-0">
               {(!customer.commissionDistribution || customer.commissionDistribution.length === 0) ? (
                 <p className="p-6 text-sm text-slate-500 italic">Commission not yet generated. Deal must be registered/booked.</p>
               ) : (
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-3">Advisor</th>
                       <th className="px-6 py-3 text-right">Slab %</th>
                       <th className="px-6 py-3 text-right">Earned Total</th>
                       <th className="px-6 py-3 text-right">Released So Far</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {customer.commissionDistribution.map((dist, idx) => {
                       if (!dist) return null;
                       return (
                       <tr key={idx} className="hover:bg-slate-50">
                         <td className="px-6 py-3">
                           <p className="font-bold text-slate-900">{dist.advisor?.name || 'Unknown'}</p>
                           {isOwner && dist.advisor?.email && <p className="text-xs text-slate-500">{dist.advisor.email}</p>}
                         </td>
                         <td className="px-6 py-3 text-right font-bold text-indigo-600">{dist.percent}%</td>
                         <td className="px-6 py-3 text-right font-medium text-slate-700">{formatCurrency(dist.earnedAmount)}</td>
                         <td className="px-6 py-3 text-right font-black text-emerald-600">{formatCurrency(dist.releasedAmount)}</td>
                       </tr>
                       );
                     })}
                     {isOwner && customer.companyShareAmount > 0 && (
                        <tr className="bg-red-50/30">
                           <td className="px-6 py-3">
                             <p className="font-bold text-red-900">Company Retained Margin</p>
                           </td>
                           <td className="px-6 py-3 text-right font-bold text-red-600">{customer.companySharePercent}%</td>
                           <td className="px-6 py-3 text-right font-medium text-red-700">{formatCurrency(customer.companyShareAmount)}</td>
                           <td className="px-6 py-3 text-right font-black text-red-600">-</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LedgerTable({ customers, isOwner = false }) {
  const [selectedCust, setSelectedCust] = useState(null);

  // Consider booked, pending_registration, and registered as active financial ledgers
  const ledgerCustomers = customers.filter(c => {
    const s = (c.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'REGISTERED' || s === 'PENDING_REGISTRATION';
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Client Detail</th>
              {isOwner && <th className="px-6 py-4">Agent</th>}
              <th className="px-6 py-4 text-right">Total Owed</th>
              <th className="px-6 py-4 text-right">Paid to Date</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ledgerCustomers.length === 0 ? (
              <tr>
                <td colSpan={isOwner ? 6 : 5} className="py-8 text-center text-slate-400 italic">No active financial ledgers found</td>
              </tr>
            ) : (
              ledgerCustomers.map(c => {
                const finalAmt = c.finalAmount || 0;
                const paidAmt = c.amountPaid || 0;
                const bal = finalAmt - paidAmt;
                return (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-base">{c.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Block {c.block || 'A'}, Plot {c.plotNumber}</p>
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-700">{c.advisor?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400">{c.advisor?.advisorId || ''}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{formatCurrency(finalAmt)}</td>
                    <td className="px-6 py-4 text-right font-black text-green-600">{formatCurrency(paidAmt)}</td>
                    <td className="px-6 py-4 text-right font-black text-orange-600">{formatCurrency(bal)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                         onClick={() => setSelectedCust(c)}
                         className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors text-xs uppercase tracking-widest"
                      >
                         Ledger
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <LedgerModal customer={selectedCust} onClose={() => setSelectedCust(null)} isOwner={isOwner} />
    </div>
  );
}
