import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fetchDevData, resetAdvisorTotals } from '../../services/devApi.js';
import LedgerTable from '../advisor/LedgerTable.jsx';
import { useToast, useConfirm } from '../../context/AppProvider.jsx';
import OwnerLogin from './OwnerLogin.jsx';

const inr = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMonth = (d) => d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

import { RiHistoryLine, RiWallet3Line, RiInformationLine, RiTimeLine } from "react-icons/ri";

const normalizeStatus = (s = '') => {
  const u = s.toUpperCase();
  if (u === 'CONFIRMED') return 'REGISTERED';
  if (u === 'NOT-CONFIRMED' || u === 'WAITING') return 'WAITING';
  if (u === 'BOOKED') return 'BOOKED';
  if (u === 'REGISTERED') return 'REGISTERED';
  return u || 'WAITING';
};
const statusStyle = (s = '') => {
  const u = normalizeStatus(s);
  if (u === 'REGISTERED') return 'text-purple-700 bg-purple-100 border border-purple-300';
  if (u === 'BOOKED') return 'text-yellow-700 bg-yellow-100 border border-yellow-300';
  return 'text-gray-600 bg-gray-100 border border-gray-300';
};

const STATUS_COLORS = { WAITING: '#94a3b8', BOOKED: '#f59e0b', REGISTERED: '#8b5cf6' };
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899'];

const SLABS_DATA = [
  { level: 1, rate: 5, name: 'Joined', total: 0, self: 0 },
  { level: 2, rate: 7, name: 'Mobile', total: 500000, self: 500000 },
  { level: 3, rate: 9, name: 'Fridge', total: 2500000, self: 1000000 },
  { level: 4, rate: 11, name: 'Scooty', total: 5000000, self: 2000000 },
  { level: 5, rate: 13, name: 'i10', total: 10000000, self: 3500000 },
  { level: 6, rate: 14, name: 'XUV-300', total: 50000000, self: 5000000 },
  { level: 7, rate: 15, name: 'Nexon', total: 100000000, self: 7500000 },
  { level: 8, rate: 16, name: 'XUV-700', total: 250000000, self: 10000000 },
  { level: 9, rate: 17, name: 'Fortuner', total: 550000000, self: 20000000 },
  { level: 10, rate: 18, name: 'BMW', total: 1100000000, self: 50000000 },
];

function getSlabFor(a) {
  let res = SLABS_DATA[0];
  for (let s of SLABS_DATA) {
    if ((a.totalBusiness || 0) >= s.total && (a.selfBusiness || 0) >= s.self) res = s;
    else break;
  }
  return res;
}

function getTreeSales(advisor, advisors, monthSales) {
  let sales = monthSales.filter(c => (c.advisor?._id || c.advisor) === advisor._id);
  (advisor.connectedAdvisors || []).forEach(childId => {
    const cid = childId._id || childId;
    const child = advisors.find(a => a._id === cid);
    if (child) sales = sales.concat(getTreeSales(child, advisors, monthSales));
  });
  return sales;
}

function getIncentiveDetails(advisor, advisors, customers, month, year) {
  const allMonthlySales = customers.filter(c => {
    const d = new Date(c.actualDate);
    const st = (c.status || '').toUpperCase();
    // Closed sale = BOOKED for ALL payment modes (unified rule)
    return d.getMonth() === month && d.getFullYear() === year &&
      ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(st);
  });

  const mySlab = getSlabFor(advisor);
  const myRate = mySlab.rate;

  const myDirectSales = allMonthlySales.filter(c => (c.advisor?._id || c.advisor) === advisor._id);
  const selfIncentiveTotal = myDirectSales.reduce((s, c) => s + (c.finalAmount || 0) * myRate / 100, 0);

  const teamBreakdown = [];
  (advisor.connectedAdvisors || []).forEach(childId => {
    const cid = childId._id || childId;
    const child = advisors.find(a => a._id === cid);
    if (!child) return;

    const childSlab = getSlabFor(child);
    const childRate = childSlab.rate;
    const diffRate = Math.max(0, myRate - childRate);

    const childTreeSales = getTreeSales(child, advisors, allMonthlySales);
    const childTotalVolume = childTreeSales.reduce((s, c) => s + (c.finalAmount || 0), 0);
    const diffIncentive = (childTotalVolume * diffRate) / 100;

    if (childTotalVolume > 0 || diffIncentive > 0) {
      teamBreakdown.push({
        childName: child.name,
        childRate,
        diffRate,
        totalVolume: childTotalVolume,
        incentive: diffIncentive,
        salesList: childTreeSales
      });
    }
  });

  return {
    advisor,
    mySlab,
    myDirectSales,
    selfIncentiveTotal,
    teamBreakdown,
    grandTotal: selfIncentiveTotal + teamBreakdown.reduce((s, t) => s + t.incentive, 0)
  };
}

function CalculationModal({ details, onClose }) {
  if (!details) return null;
  const { advisor: a, mySlab, myDirectSales, selfIncentiveTotal, teamBreakdown, grandTotal } = details;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 scrollbar-hide" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black">{a.name}'s Payout Calculation</h2>
              <p className="opacity-90 font-extrabold uppercase tracking-widest text-[14px] mt-1">
                Current Level: {mySlab.name} ({mySlab.rate}%) · {grandTotal > 0 ? "Transparency Breakdown" : "No Activity"}
              </p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full w-9 h-9 flex items-center justify-center transition-colors">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Section 1: Personal Sales */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <span className="text-xl">🧑‍💼</span>
              <h3 className="text-[16px] font-black text-gray-700 uppercase tracking-wider">Personal Commission ({mySlab.rate}%)</h3>
            </div>
            {myDirectSales.length === 0 ? (
              <p className="text-[14px] text-gray-400 italic">No personal sales this month.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/50">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-gray-400 uppercase font-black border-b border-gray-100">
                    <tr><th className="p-3">Customer</th><th className="p-3">Property</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Commission</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myDirectSales.map(c => (
                      <tr key={c._id}>
                        <td className="p-3 font-extrabold">{c.name}</td>
                        <td className="p-3">{c.projectName} (Plot {c.plotNumber})</td>
                        <td className="p-3 text-right font-extrabold">{inr(c.finalAmount)}</td>
                        <td className="p-3 text-right font-black text-emerald-600">+{inr((c.finalAmount * mySlab.rate) / 100)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/50 font-black">
                      <td colSpan="3" className="p-3 text-right text-gray-600 uppercase tracking-widest">Subtotal</td>
                      <td className="p-3 text-right text-emerald-700">{inr(selfIncentiveTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 2: Team Differential */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <span className="text-xl">👥</span>
              <h3 className="text-[16px] font-black text-gray-700 uppercase tracking-wider">Team Differential Earnings</h3>
            </div>
            {teamBreakdown.length === 0 ? (
              <p className="text-[14px] text-gray-400 italic">No team performance earnings this month.</p>
            ) : (
              <div className="space-y-6">
                {teamBreakdown.map((t, idx) => (
                  <div key={idx} className="rounded-2xl border border-blue-100 bg-blue-50/30 overflow-hidden shadow-sm">
                    <div className="bg-blue-100/50 px-4 py-2.5 flex justify-between items-center flex-wrap gap-2">
                      <span className="text-[14px] font-black text-blue-900 uppercase tracking-widest">Branch: {t.childName}</span>
                      <div className="flex gap-4 text-[12px] font-extrabold text-blue-700">
                        <span>Owner: {mySlab.rate}%</span>
                        <span>Downline: {t.childRate}%</span>
                        <span className="bg-white/80 px-2 rounded-full border border-blue-200">GAP: {t.diffRate}%</span>
                      </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead className="text-gray-400 border-b border-blue-100/30">
                          <tr><th className="px-4 py-2">Team Transaction</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right text-blue-700">Your Share ({t.diffRate}%)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50/50">
                          {t.salesList.map(s => (
                            <tr key={s._id} className="text-gray-600">
                              <td className="px-4 py-2">{s.name} ({s.projectName})</td>
                              <td className="px-4 py-2 text-right">{inr(s.finalAmount)}</td>
                              <td className="px-4 py-2 text-right font-extrabold text-blue-600">+{inr((s.finalAmount * t.diffRate) / 100)}</td>
                            </tr>
                          ))}
                          <tr className="bg-white font-black text-blue-800 border-t border-blue-100">
                            <td className="px-4 py-3 uppercase tracking-widest opacity-60">Branch Total Sales: {inr(t.totalVolume)}</td>
                            <td colSpan="2" className="px-4 py-3 text-right">Differential: {inr(t.incentive)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="shr-0 bg-gray-50 border-t border-gray-100 p-6 flex justify-between items-center">
          <div>
            <p className="text-[12px] text-gray-400 font-extrabold uppercase tracking-widest mb-1">Grand Total Incentive</p>
            <p className="text-3xl font-black text-emerald-600">{inr(grandTotal)}</p>
          </div>
          <p className="text-[14px] text-gray-400 italic text-right max-w-[200px]">Data transparently calculated based on current active business slab levels.</p>
        </div>
      </div>
    </div>
  );
}

function buildTree(advisors) {
  const map = {};
  advisors.forEach(a => { map[a._id] = { ...a, children: [] }; });
  const roots = [];
  advisors.forEach(a => {
    if (a.parentAdvisor && map[a.parentAdvisor._id || a.parentAdvisor]) {
      map[a.parentAdvisor._id || a.parentAdvisor].children.push(map[a._id]);
    } else roots.push(map[a._id]);
  });
  return roots;
}

function TreeNode({ node, depth = 0, onAdvisorClick }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children?.length > 0;
  return (
    <div className={depth > 0 ? 'ml-6' : ''}>
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors ${depth === 0 ? 'bg-indigo-50 border border-indigo-100 mb-1' : ''}`}>
        <span className="text-indigo-400 font-black text-[14px] w-4 flex-shrink-0 cursor-pointer" onClick={() => hasChildren && setOpen(o => !o)}>
          {hasChildren ? (open ? '▼' : '▶') : ''}
        </span>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onAdvisorClick(node)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-800 text-[16px] hover:text-indigo-700">{node.name}</span>
            {node.advisorId && <span className="text-[14px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-extrabold border border-indigo-200">{node.advisorId}</span>}
          </div>
          <div className="flex gap-4 mt-0.5 flex-wrap">
            <span className="text-[14px] text-gray-500">📧 {node.email}</span>
            {hasChildren && <span className="text-[14px] text-blue-600">👥 {node.children.length} members</span>}
          </div>
        </div>
        <button onClick={() => onAdvisorClick(node)} className="text-[14px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded-lg font-extrabold transition-colors flex-shrink-0">View →</button>
      </div>
      {open && hasChildren && (
        <div className="ml-4 border-l-2 border-indigo-100 pl-2 space-y-0.5">
          {node.children.map(c => <TreeNode key={c._id} node={c} depth={depth + 1} onAdvisorClick={onAdvisorClick} />)}
        </div>
      )}
    </div>
  );
}

function CustomerModal({ c, onClose }) {
  if (!c) return null;
  const st = normalizeStatus(c.status);
  const hdr = st === 'REGISTERED' ? 'bg-purple-600' : st === 'BOOKED' ? 'bg-yellow-500' : 'bg-gray-500';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className={`p-6 rounded-t-2xl ${hdr} text-white flex justify-between items-start`}>
          <div><h2 className="text-2xl font-black">{c.name}</h2><p className="opacity-80 text-[16px]">{c.projectName} · Plot {c.plotNumber}</p></div>
          <div className="flex gap-3"><span className="bg-white/20 px-3 py-1 rounded-full text-[16px] font-black">{st}</span><button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center font-black text-xl">×</button></div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-[16px]">
          <div><h3 className="font-black text-gray-700 text-[14px] uppercase tracking-widest mb-2">Contact</h3>
            {[['Phone', c.phoneNumber], ['Email', c.email], ['Aadhar', c.aadhar], ['Address', c.address]].map(([k, v]) => v && (
              <div key={k} className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">{k}</span><span className="font-extrabold text-right max-w-[200px] truncate">{v}</span></div>
            ))}
          </div>
          <div><h3 className="font-black text-gray-700 text-[14px] uppercase tracking-widest mb-2">Property</h3>
            {[['Project', c.projectName], ['Plot No.', c.plotNumber], ['Size', c.plotSize], ['Block', c.block], ['Rate/sqft', c.price > 0 ? inr(c.price) : null]].map(([k, v]) => v && (
              <div key={k} className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">{k}</span><span className="font-extrabold">{v}</span></div>
            ))}
          </div>
          <div><h3 className="font-black text-gray-700 text-[14px] uppercase tracking-widest mb-2">Payments</h3>
            {[['Base', inr(c.baseAmount)], ['Extra', c.extraCharges > 0 ? inr(c.extraCharges) : null], ['Final', inr(c.finalAmount)], ['Paid', inr(c.bookingAmount)], ['Mode', c.paymentMode], ['Duration', c.tenure > 0 ? `${c.tenure} months` : null], ['Monthly EMI', c.emi > 0 ? inr(c.emi) : null]].map(([k, v]) => v && (
              <div key={k} className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">{k}</span><span className="font-extrabold">{v}</span></div>
            ))}
          </div>
          <div><h3 className="font-black text-gray-700 text-[14px] uppercase tracking-widest mb-2">Timeline</h3>
            {[['Created', fmt(c.actualDate)], ['Booked', c.bookingDate ? fmt(c.bookingDate) : null], ['Registered', c.registrationDate ? fmt(c.registrationDate) : null], ['Advisor', c.advisor?.name]].map(([k, v]) => v && (
              <div key={k} className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">{k}</span><span className="font-extrabold">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvisorModal({ advisor: a, leads, onClose, onCustomerClick }) {
  if (!a) return null;
  const myLeads = leads.filter(c => c.advisor?._id === a._id || c.advisor === a._id);
  const revenue = myLeads.filter(c => ['BOOKED', 'REGISTERED', 'booked', 'confirmed'].includes(c.status)).reduce((s, c) => s + (c.finalAmount || 0), 0);
  const counts = myLeads.reduce((acc, c) => { const s = normalizeStatus(c.status); acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 rounded-t-2xl text-white">
          <div className="flex justify-between items-start mb-4">
            <div><h2 className="text-2xl font-black">{a.name}</h2><p className="opacity-80 text-[16px]">{a.email} · {a.phoneNumber}</p></div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center font-black text-xl">×</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[['Leads', myLeads.length], ['Waiting', counts.WAITING || 0], ['Booked', counts.BOOKED || 0], ['Registered', counts.REGISTERED || 0]].map(([l, v]) => (
              <div key={l} className="bg-white/10 rounded-xl p-3 text-center"><p className="text-xl font-black">{v}</p><p className="text-[14px] opacity-70">{l}</p></div>
            ))}
          </div>
          <p className="mt-3 text-indigo-200 text-[16px]">Total Sales: <span className="text-white font-black text-xl">{inr(revenue)}</span></p>
        </div>
        <div className="p-4 space-y-2">
          {myLeads.length === 0
            ? <p className="text-center text-gray-400 italic py-8">No leads yet.</p>
            : myLeads.map(c => (
              <div key={c._id} onClick={() => onCustomerClick(c)} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[16px]">{c.name?.[0]?.toUpperCase() || '?'}</div>
                  <div><p className="font-extrabold text-gray-800 text-[16px]">{c.name}</p><p className="text-[14px] text-gray-500">{c.projectName} · Plot {c.plotNumber} · {fmt(c.actualDate)}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-emerald-700 text-[16px]">{inr(c.finalAmount)}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[14px] font-black ${statusStyle(c.status)}`}>{normalizeStatus(c.status)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function DateFilterBar({ from, to, onFrom, onTo, onClear, count, total, label = 'entries' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest"></span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[12px] text-slate-500 font-extrabold uppercase tracking-widest">From</label>
        <input type="date" value={from} onChange={e => onFrom(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-[16px] text-slate-700 outline-none focus:border-indigo-400 font-extrabold transition-colors" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[12px] text-slate-500 font-extrabold uppercase tracking-widest">To</label>
        <input type="date" value={to} onChange={e => onTo(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 text-[16px] text-slate-700 outline-none focus:border-indigo-400 font-extrabold transition-colors" />
      </div>
      {(from || to) && (
        <button onClick={onClear} className="text-[12px] text-rose-500 hover:text-rose-700 font-extrabold uppercase tracking-wider border border-rose-200 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors">✕ Clear</button>
      )}
      {(from || to) && <span className="text-[12px] text-indigo-600 font-extrabold uppercase tracking-widest ml-auto bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-md">{count} of {total} {label} in range</span>}
    </div>
  );
}

function useSorted(data, defaultKey = '', defaultDir = 'desc') {
  const [sk, setSk] = useState(defaultKey);
  const [sd, setSd] = useState(defaultDir);
  const toggle = (k) => { if (sk === k) setSd(d => d === 'asc' ? 'desc' : 'asc'); else { setSk(k); setSd('desc'); } };
  const sorted = useMemo(() => !sk ? data : [...data].sort((a, b) => {
    const av = typeof a[sk] === 'string' ? a[sk].toLowerCase() : (a[sk] || 0);
    const bv = typeof b[sk] === 'string' ? b[sk].toLowerCase() : (b[sk] || 0);
    return sd === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (bv < av ? -1 : bv > av ? 1 : 0);
  }), [data, sk, sd]);
  const Th = ({ label, k, right }) => (
    <th className={`p-4 cursor-pointer select-none hover:bg-indigo-50 transition-colors ${right ? 'text-right' : ''}`} onClick={() => toggle(k)}>
      <span className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>{label}<span className="text-gray-300 text-[14px]">{sk === k ? (sd === 'asc' ? '↑' : '↓') : '↕'}</span></span>
    </th>
  );
  return { sorted, Th };
}

function inDateRange(val, from, to) {
  if (!val) return false;
  const d = new Date(val);
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + 'T23:59:59')) return false;
  return true;
}

export default function MyPanel() {
  // ── Auth gate ──────────────────────────────────────────────────────────────
  const [authed, setAuthed] = useState(() => {
    const token = sessionStorage.getItem('ownerToken');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  });

  if (!authed) return <OwnerLogin onSuccess={() => setAuthed(true)} />;
  return <MyPanelInner setAuthed={setAuthed} />;
}

function MyPanelInner({ setAuthed }) {
  const [advisors, setAdvisors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [advisorFilter, setAdvisorFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [calcDetails, setCalcDetails] = useState(null);

  // Global date range
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // EMI Tracker — expand state (must be top-level, not inside conditional)
  const [expEmi, setExpEmi] = useState(null);

  // Transaction Logs — filter state (must be top-level)
  const [logType, setLogType] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Live Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dayStr = now.toLocaleDateString('en-IN', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const [resetting, setResetting] = useState(false);

  const loadPanelData = async () => {
    setLoading(true);
    setLoadError(null);
    const result = await fetchDevData();
    if (result.ok && result.data) {
      setAdvisors(result.data.advisors);
      setCustomers(result.data.customers);
      setStats(result.data.stats);
    } else {
      setLoadError(result.error || 'Failed to load data');
      setAdvisors([]);
      setCustomers([]);
      setStats({});
    }
    setLoading(false);
  };

  const toast = useToast();
  const confirm = useConfirm();

  const handleResetTotals = async () => {
    const ok = await confirm({
      title: 'Recalculate All Earnings?',
      message: 'This will recalculate ALL advisor sales & earnings from current customer data. This cannot be undone. Continue?',
      confirmText: 'Yes, Recalculate',
      type: 'danger'
    });
    if (!ok) return;
    setResetting(true);
    const result = await resetAdvisorTotals();
    setResetting(false);
    if (result.ok) {
      toast.success(result.data.message + ' — Data reloaded.', 'Sync Complete');
      await loadPanelData();
    } else {
      toast.error('Reset failed: ' + result.error, 'Sync Failed');
    }
  };

  useEffect(() => {
    loadPanelData();
  }, []);


  const sc = stats.statusCounts || {};
  const totalRevenue = stats.totalRevenue || 0;
  const rev = stats.revenueByAdvisor || [];
  const tree = useMemo(() => buildTree(advisors), [advisors]);

  // Date-filtered customers
  const dateFilteredCustomers = useMemo(() => {
    if (!dateFrom && !dateTo) return customers;
    return customers.filter(c => inDateRange(c.actualDate, dateFrom, dateTo));
  }, [customers, dateFrom, dateTo]);

  // KPIs from date-filtered set
  const dfRevenue = useMemo(() =>
    dateFilteredCustomers.filter(c => ['booked', 'registered', 'confirmed', 'BOOKED', 'REGISTERED', 'CONFIRMED'].includes(c.status))
      .reduce((s, c) => s + (c.finalAmount || 0), 0)
    , [dateFilteredCustomers]);
  const dfStatusCounts = useMemo(() => dateFilteredCustomers.reduce((acc, c) => {
    const s = normalizeStatus(c.status); acc[s] = (acc[s] || 0) + 1; return acc;
  }, {}), [dateFilteredCustomers]);

  const goToLeads = (sf = 'ALL') => { setStatusFilter(sf); setAdvisorFilter('ALL'); setSearch(''); setTab(2); };
  const openAdvisorModal = (a) => setSelectedAdvisor(a);
  const openCustomerModal = (c) => { setSelectedCustomer(c); setSelectedAdvisor(null); };
  const clearDates = () => { setDateFrom(''); setDateTo(''); };

  // All customer filters
  const filteredCustomers = useMemo(() => dateFilteredCustomers.filter(c => {
    const ms = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber?.includes(search) || c.projectName?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'ALL' || normalizeStatus(c.status) === statusFilter;
    const ma = advisorFilter === 'ALL' || c.advisor?._id === advisorFilter;
    return ms && mst && ma;
  }), [dateFilteredCustomers, search, statusFilter, advisorFilter]);

  // ── Monthly revenue trend chart data ──
  const monthlyData = useMemo(() => {
    const map = {};
    customers.forEach(c => {
      if (!c.actualDate) return;
      const key = fmtMonth(c.actualDate);
      if (!map[key]) map[key] = { month: key, revenue: 0, booked: 0, registered: 0, waiting: 0 };
      const s = normalizeStatus(c.status);
      if (s === 'BOOKED') { map[key].revenue += c.finalAmount || 0; map[key].booked++; }
      else if (s === 'REGISTERED') { map[key].revenue += c.finalAmount || 0; map[key].registered++; }
      else map[key].waiting++;
    });
    return Object.values(map).slice(-12);
  }, [customers]);

  // ── Advisor bar chart ──
  const advisorBarData = useMemo(() =>
    [...rev].sort((a, b) => b.totalBusiness - a.totalBusiness).slice(0, 8).map(a => ({
      name: a.name?.split(' ')[0] || a.name,
      'Total Sales': a.totalBusiness,
      'Own Sales': a.selfBusiness,
    }))
    , [rev]);

  // ── Pie data ──
  const pieData = useMemo(() => [
    { name: 'Registered', value: dfStatusCounts.REGISTERED || 0, color: STATUS_COLORS.REGISTERED },
    { name: 'Booked', value: dfStatusCounts.BOOKED || 0, color: STATUS_COLORS.BOOKED },
    { name: 'Waiting', value: dfStatusCounts.WAITING || 0, color: STATUS_COLORS.WAITING },
  ].filter(d => d.value > 0), [dfStatusCounts]);

  const { sorted: sortedCustomers, Th: CustTh } = useSorted(filteredCustomers, 'actualDate', 'desc');
  const { sorted: sortedAdvisors, Th: AdvTh } = useSorted(advisors, 'totalBusiness', 'desc');
  const { sorted: sortedPerf, Th: PerfTh } = useSorted(rev.map(a => ({ ...a })), 'totalBusiness', 'desc');

  const TABS = ['📊 Dashboard', '🌳 Team', '📋 Customers', '🧑‍💼 Advisors', '📋 Payment Tracker', '💠 Commissions', '💰 Payouts', '📜 Logs', '📖 Ledger'];

  const customTooltipInr = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-[14px]">
        <p className="font-black text-gray-700 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-extrabold">{p.name}: {p.name.includes('Sales') || p.name === 'revenue' ? inr(p.value) : p.value}</p>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
      <div className="text-center"><div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white font-extrabold text-xl">Loading company data...</p></div>
    </div>
  );

  const isDateFiltered = !!(dateFrom || dateTo);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {selectedCustomer && <CustomerModal c={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
      {selectedAdvisor && <AdvisorModal advisor={selectedAdvisor} leads={customers} onClose={() => setSelectedAdvisor(null)} onCustomerClick={c => { setSelectedAdvisor(null); setTimeout(() => setSelectedCustomer(c), 50); }} />}
      {calcDetails && <CalculationModal details={calcDetails} onClose={() => setCalcDetails(null)} />}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-sm transition-all">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl border border-indigo-100 shadow-sm">🏢</div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl xl:text-3xl font-black tracking-tight text-slate-800">Nutan Housing <span className="font-extrabold text-slate-400">| Owner</span></h1>
                  <button onClick={loadPanelData} className="flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-md font-extrabold text-xs uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 shadow-sm transition-all whitespace-nowrap">🔄 Refresh</button>
                  <button onClick={() => { sessionStorage.removeItem('ownerToken'); setAuthed(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-md font-extrabold text-xs uppercase tracking-wider bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shadow-sm transition-all whitespace-nowrap">
                    🚪 Logout
                  </button>
                </div>
                <p className="text-slate-500 text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2 mt-1">
                  <span className="text-indigo-600">{timeStr}</span>
                  <span className="opacity-40 text-slate-400">|</span>
                  <span>{dayStr}</span>
                  <span className="opacity-40 text-slate-400">|</span>
                  <span className="text-slate-600">{dateStr}</span>
                </p>
              </div>
            </div>
            {/* KPI tiles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-2 xl:mt-0">
              {[
                { label: 'Advisors', val: advisors.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🧑‍💼', action: () => setTab(3) },
                { label: 'Customers', val: customers.filter(c => normalizeStatus(c.status) !== 'WAITING').length, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: '📋', action: () => goToLeads('ALL') },
                { label: 'Waiting', val: sc.WAITING || 0, color: 'text-slate-500', bg: 'bg-slate-100', icon: '⏳', action: () => goToLeads('WAITING') },
                { label: 'Booked', val: sc.BOOKED || 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '📑', action: () => goToLeads('BOOKED') },
                { label: 'Registered', val: sc.REGISTERED || 0, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🏠', action: () => goToLeads('REGISTERED') },
                { label: 'Revenue', val: inr(totalRevenue), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '💰', action: () => goToLeads('ALL') },
              ].map(k => (
                <button key={k.label} onClick={k.action} className={`${k.bg} border border-transparent hover:border-slate-300 px-3 py-2 rounded-xl text-center transition-all group shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md cursor-pointer`}>
                  <p className="text-[18px] group-hover:scale-110 transition-transform">{k.icon}</p>
                  <p className={`text-[16px] font-black ${k.color}`}>{k.val}</p>
                  <p className="text-[12px] text-slate-500 uppercase font-black tracking-wider">{k.label}</p>
                </button>
              ))}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1.5 mt-5 overflow-x-auto pb-1 items-center">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${tab === i ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 bg-white border border-slate-200'}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* Filtered KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          {[
            { label: 'Advisors (Joined)', val: advisors.filter(a => inDateRange(a.date, dateFrom, dateTo)).length, color: 'text-blue-600', icon: '🧑‍💼' },
            { label: 'Leads', val: dateFilteredCustomers.filter(c => normalizeStatus(c.status) !== 'WAITING').length, color: 'text-cyan-600', icon: '📋' },
            { label: 'Waiting', val: dfStatusCounts.WAITING || 0, color: 'text-slate-500', icon: '⏳' },
            { label: 'Booked', val: dfStatusCounts.BOOKED || 0, color: 'text-yellow-600', icon: '📑' },
            { label: 'Registered', val: dfStatusCounts.REGISTERED || 0, color: 'text-purple-600', icon: '🏠' },
            { label: 'Revenue', val: inr(dfRevenue), color: 'text-emerald-600', icon: '💰' },
          ].map(k => (
            <div key={k.label} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-center transition-all group">
              <p className="text-lg group-hover:scale-110 transition-transform mb-1">{k.icon}</p>
              <p className={`text-lg font-black ${k.color}`}>{k.val}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{k.label}</p>
            </div>
          ))}
        </div>

        {loadError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-[16px] space-y-2">
            <p className="font-extrabold">Could not load company data</p>
            <p className="opacity-90">{loadError}</p>
            <button type="button" onClick={loadPanelData} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-extrabold text-[14px] uppercase">Retry</button>
          </div>
        )}
        {!loadError && advisors.length === 0 && customers.length === 0 && (
          <p className="text-amber-800 text-[16px] font-extrabold border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
            No advisors or customers in this database yet — or the environment is empty.
          </p>
        )}

        {/* Global Date Filter */}
        <DateFilterBar
          from={dateFrom} to={dateTo}
          onFrom={setDateFrom} onTo={setDateTo}
          onClear={clearDates}
          count={dateFilteredCustomers.length} total={customers.length}
          label="customers"
        />

        {/* ═══ DASHBOARD ═══ */}
        {tab === 0 && (
          <div className="space-y-6">
            {/* Top KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <div onClick={() => goToLeads('ALL')} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 col-span-1 sm:col-span-2 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-start"><h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Total Revenue {isDateFiltered && '(Filtered)'}</h3><span className="opacity-0 group-hover:opacity-100 text-indigo-500 text-[12px] font-black uppercase tracking-widest">View all →</span></div>
                <p className="text-4xl font-black text-emerald-600 mt-2">{isDateFiltered ? inr(dfRevenue) : inr(totalRevenue)}</p>
                <p className="text-[14px] text-slate-400 mt-1 font-extrabold">Booked &amp; Registered closures only</p>
                <div className="mt-5 flex gap-3 flex-wrap">
                  {[['Booked', isDateFiltered ? dfStatusCounts.BOOKED || 0 : sc.BOOKED || 0, 'bg-amber-50 text-amber-600 border-amber-200', 'BOOKED'],
                  ['Registered', isDateFiltered ? dfStatusCounts.REGISTERED || 0 : sc.REGISTERED || 0, 'bg-purple-50 text-purple-600 border-purple-200', 'REGISTERED'],
                  ['Waiting queue', isDateFiltered ? dfStatusCounts.WAITING || 0 : sc.WAITING || 0, 'bg-slate-50 text-slate-500 border-slate-200', 'WAITING']].map(([l, c, cl, f]) => (
                    <button key={l} onClick={e => { e.stopPropagation(); goToLeads(f); }} className={`px-4 py-1.5 rounded-lg text-[14px] font-black border ${cl} transition-colors hover:opacity-80`}>{l}: {c}</button>
                  ))}
                </div>
              </div>
              <div onClick={() => setTab(3)} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-start"><h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Advisors</h3><span className="opacity-0 group-hover:opacity-100 text-indigo-500 text-[12px] font-black uppercase tracking-widest">View →</span></div>
                <p className="text-4xl font-black text-blue-600 mt-3">{advisors.length}</p>
                <p className="text-[14px] text-slate-400 mt-2 font-extrabold">Total registered associates</p>
              </div>
              <div onClick={() => goToLeads('ALL')} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-start"><h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Customers {isDateFiltered && '(Filtered)'}</h3><span className="opacity-0 group-hover:opacity-100 text-indigo-500 text-[12px] font-black uppercase tracking-widest">View →</span></div>
                <p className="text-4xl font-black text-cyan-600 mt-3">{dateFilteredCustomers.filter(c => normalizeStatus(c.status) !== 'WAITING').length}</p>
                <p className="text-[14px] text-slate-400 mt-2 font-extrabold">Active Customers</p>
              </div>
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Revenue trend */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider mb-4">📈 Monthly Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={customTooltipInr} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Status donut */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider mb-4">🍩 Customer Status {isDateFiltered && '(filtered)'}</h2>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-center py-16 italic">No data in selected range</p>}
              </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Advisor performance bar */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider mb-4">🏆 Advisor Performance</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={advisorBarData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={customTooltipInr} />
                    <Legend />
                    <Bar dataKey="Total Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Own Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Monthly counts bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider mb-4">📊 Monthly Leads</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={customTooltipInr} />
                    <Legend />
                    <Bar dataKey="booked" name="Booked" fill={STATUS_COLORS.BOOKED} radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="registered" name="Registered" fill={STATUS_COLORS.REGISTERED} radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="waiting" name="Waiting" fill={STATUS_COLORS.WAITING} radius={[3, 3, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top performers */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-[14px] font-black text-slate-500 uppercase tracking-widest">💰 Top Associates</h2>
                <span className="text-[12px] text-slate-400 font-extrabold uppercase tracking-wider">Click row for details</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[16px]">
                  <thead className="bg-white text-slate-400 text-[12px] uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-left font-black">Rank</th>
                      <th className="p-4 text-left font-black">Advisor</th>
                      <PerfTh label="Total Sales Value" k="totalBusiness" right />
                      <PerfTh label="Direct Sales" k="selfBusiness" right />
                      <PerfTh label="Network" k="teamSize" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedPerf.map((a, i) => {
                      const adv = advisors.find(x => x.name === a.name);
                      return (
                        <tr key={i} onClick={() => adv && openAdvisorModal(adv)} className={`hover:bg-slate-50 transition-colors ${adv ? 'cursor-pointer' : ''}`}>
                          <td className="py-4 px-4 text-[18px]">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-400 text-[14px] font-black px-1 border border-slate-100 rounded-md">#{i + 1}</span>}</td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-700">{a.name}</span>
                              {a.advisorId && <span className="text-[12px] uppercase font-black tracking-widest text-indigo-500 mt-0.5">{a.advisorId}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-black text-emerald-600">{inr(a.totalBusiness)}</td>
                          <td className="py-4 px-4 text-right text-blue-600 font-extrabold">{inr(a.selfBusiness)}</td>
                          <td className="py-4 px-4 text-center"><span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md text-[14px] font-extrabold border border-indigo-100">{a.teamSize}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest customers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider">🕐 Latest Customers {isDateFiltered && `(${dateFilteredCustomers.length} in range)`}</h2>
                <button onClick={() => goToLeads('ALL')} className="text-[14px] text-indigo-600 font-extrabold hover:underline">View all →</button>
              </div>
              <div className="divide-y divide-gray-50">
                {[...dateFilteredCustomers].sort((a, b) => new Date(b.actualDate) - new Date(a.actualDate)).slice(0, 8).map(c => (
                  <div key={c._id} onClick={() => openCustomerModal(c)} className="flex justify-between items-center py-3 px-5 hover:bg-indigo-50/40 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[16px] flex-shrink-0">{c.name?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <p className="font-extrabold text-gray-800 text-[16px]">{c.name}</p>
                        <p className="text-[14px] text-gray-500">{c.projectName} · Plot {c.plotNumber} · {fmt(c.actualDate)}{c.advisor ? ` · ${c.advisor.name}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[16px] font-black text-emerald-600">{inr(c.finalAmount)}</span>
                      <span className={`px-3 py-1 rounded-full text-[14px] font-black uppercase ${statusStyle(c.status)}`}>{normalizeStatus(c.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TEAM STRUCTURE ═══ */}
        {tab === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider mb-2">🌳 Company Team Structure</h2>
              <p className="text-[14px] text-gray-400 mb-5">Click a name to see their leads. Click the arrow to expand team.</p>
              {tree.length === 0 ? <p className="text-gray-400 text-center py-10 italic">No team structure found.</p>
                : <div className="space-y-1">{tree.map(n => <TreeNode key={n._id} node={n} depth={0} onAdvisorClick={openAdvisorModal} />)}</div>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {advisors.map(a => {
                const aLeads = customers.filter(c => c.advisor?._id === a._id || c.advisor === a._id);
                const aFiltered = dateFilteredCustomers.filter(c => c.advisor?._id === a._id || c.advisor === a._id);
                return (
                  <div key={a._id} onClick={() => openAdvisorModal(a)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-gray-800 text-[18px] group-hover:text-indigo-700">{a.name}</p>
                        {a.advisorId && <p className="text-[14px] text-indigo-600 font-extrabold">{a.advisorId}</p>}
                        <p className="text-[14px] text-gray-500 mt-0.5">{a.email}</p>
                        <p className="text-[14px] text-gray-400">{a.phoneNumber}</p>
                      </div>
                      <span className="text-[14px] text-indigo-400 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">View leads →</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3 mt-2">
                      <div><p className="text-[14px] text-gray-400">Total Sales</p><p className="font-black text-emerald-600 text-[16px]">{inr(a.totalBusiness)}</p></div>
                      <div><p className="text-[14px] text-gray-400">Own Sales</p><p className="font-extrabold text-blue-600 text-[16px]">{inr(a.selfBusiness)}</p></div>
                      <div><p className="text-[14px] text-gray-400">{isDateFiltered ? 'In Range' : 'Customers'}</p><p className="font-black text-indigo-600 text-[16px]">{isDateFiltered ? aFiltered.length : aLeads.length}</p></div>
                    </div>
                    {a.parentAdvisor && <p className="text-[14px] text-gray-400 mt-2 pt-2 border-t border-gray-50">Reports to: <span className="text-indigo-600 font-extrabold">{a.parentAdvisor.name}</span></p>}
                    <p className="text-[14px] text-gray-400 mt-1">Joined: {fmt(a.date)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ALL CUSTOMERS ═══ */}
        {tab === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search name, phone, plot..." className="border border-gray-200 px-4 py-2.5 rounded-xl outline-none text-[16px] flex-1 min-w-[180px] max-w-xs focus:border-indigo-400" />
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'WAITING', 'BOOKED', 'REGISTERED'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-[14px] font-black uppercase transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>{s}</button>
                ))}
              </div>
              <select value={advisorFilter} onChange={e => setAdvisorFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-[16px] outline-none focus:border-indigo-400 bg-white text-gray-700">
                <option value="ALL">All Advisors</option>
                {advisors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
              {(statusFilter !== 'ALL' || advisorFilter !== 'ALL' || search) && <button onClick={() => { setStatusFilter('ALL'); setAdvisorFilter('ALL'); setSearch(''); }} className="text-[14px] text-red-500 font-extrabold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">✕ Clear</button>}
              <span className="text-[14px] text-gray-400 ml-auto">{filteredCustomers.length} of {customers.length}</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
              <table className="w-full text-left text-[16px]">
                <thead className="bg-gray-50 text-gray-400 text-[14px] uppercase tracking-widest font-black border-b border-gray-100">
                  <tr>
                    <CustTh label="Customer" k="name" />
                    <th className="p-4">Contact</th>
                    <th className="p-4">Property</th>
                    <CustTh label="Amount" k="finalAmount" right />
                    <th className="p-4">EMI</th>
                    <CustTh label="Date" k="actualDate" />
                    <th className="p-4">Advisor</th>
                    <CustTh label="Status" k="status" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedCustomers.map(c => (
                    <tr key={c._id} onClick={() => openCustomerModal(c)} className="hover:bg-indigo-50/40 cursor-pointer transition-colors align-top group">
                      <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[14px] flex-shrink-0">{c.name?.[0]?.toUpperCase() || '?'}</div><div><p className="font-extrabold text-gray-800 group-hover:text-indigo-700">{c.name}</p><p className="text-[14px] text-gray-400">{c.address}</p></div></div></td>
                      <td className="p-4 text-[14px]"><p className="font-extrabold text-gray-700">{c.phoneNumber}</p><p className="text-gray-400">{c.email}</p><p className="text-gray-400 font-mono text-[12px]">{c.aadhar}</p></td>
                      <td className="p-4 text-[14px]"><p className="font-extrabold text-gray-800">{c.projectName}</p><p className="text-gray-500">Plot <span className="font-extrabold">{c.plotNumber}</span> · {c.plotSize}</p>{c.block && <p className="text-gray-400">Block {c.block}</p>}</td>
                      <td className="p-4 text-[14px] text-right"><p className="font-black text-emerald-700 text-[18px]">{inr(c.finalAmount)}</p><p className="text-green-600">Paid: {inr(c.bookingAmount)}</p><p className="text-gray-400">Base: {inr(c.baseAmount)}</p></td>
                      <td className="p-4 text-[14px]"><p className="text-gray-600">{c.paymentMode || '—'}</p>{c.tenure > 0 && <p className="text-gray-500">{c.tenure}m</p>}{c.emi > 0 && <p className="text-blue-600 font-extrabold">{inr(c.emi)}/mo</p>}</td>
                      <td className="p-4 text-[14px] text-gray-400"><p>Added: <span className="text-gray-600">{fmt(c.actualDate)}</span></p>{c.bookingDate && <p>Booked: <span className="text-yellow-700">{fmt(c.bookingDate)}</span></p>}{c.registrationDate && <p>Reg: <span className="text-purple-700">{fmt(c.registrationDate)}</span></p>}</td>
                      <td className="p-4 text-[14px]">{c.advisor ? <button onClick={e => { e.stopPropagation(); const adv = advisors.find(a => a._id === c.advisor._id || a._id === c.advisor); if (adv) openAdvisorModal(adv); }} className="text-indigo-600 font-extrabold hover:underline text-left">{c.advisor.name}{c.advisor.advisorId && <><br /><span className="text-indigo-400">{c.advisor.advisorId}</span></>}</button> : <span className="text-gray-300 italic">—</span>}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-[14px] font-black uppercase ${statusStyle(c.status)}`}>{normalizeStatus(c.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCustomers.length === 0 && <p className="text-center text-gray-400 py-12 italic">No customers match the current filter.</p>}
            </div>
          </div>
        )}

        {/* ═══ ALL ADVISORS ═══ */}
        {tab === 3 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h2 className="text-[16px] font-black text-gray-700 uppercase tracking-wider">Advisors ({advisors.length})</h2><span className="text-[14px] text-gray-400">Click any row to see leads · Click headers to sort</span></div>
            <table className="w-full text-left text-[16px]">
              <thead className="bg-gray-50 text-gray-400 text-[14px] uppercase tracking-widest font-black border-b border-gray-100">
                <tr>
                  <AdvTh label="Advisor" k="name" />
                  <th className="p-4">ID Details</th>
                  <th className="p-4">Reports To</th>
                  <AdvTh label="Total Sales" k="totalBusiness" right />
                  <AdvTh label="Own Sales" k="selfBusiness" right />
                  <AdvTh label="Joined" k="date" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedAdvisors.map(a => {
                  const aLeads = customers.filter(c => c.advisor?._id === a._id || c.advisor === a._id);
                  const aFiltered = dateFilteredCustomers.filter(c => c.advisor?._id === a._id || c.advisor === a._id);
                  return (
                    <tr key={a._id} onClick={() => openAdvisorModal(a)} className="hover:bg-indigo-50/40 cursor-pointer transition-colors align-top group">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black flex-shrink-0">{a.name?.[0]?.toUpperCase() || '?'}</div><div><p className="font-black text-gray-800 group-hover:text-indigo-700">{a.name}</p>{a.advisorId && <p className="text-[14px] text-indigo-600 font-extrabold">{a.advisorId}</p>}<p className="text-[14px] text-gray-500">{a.email}</p><p className="text-[14px] text-gray-400">{a.phoneNumber}</p></div></div></td>
                      <td className="p-4 text-[14px]"><p className="text-gray-500">PAN: <span className="font-mono text-gray-800">{a.pan || '—'}</span></p><p className="text-gray-500 mt-0.5">Aadhar: <span className="font-mono text-gray-800">{a.aadhar || '—'}</span></p></td>
                      <td className="p-4 text-[14px]">{a.parentAdvisor ? <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-extrabold">↳ {a.parentAdvisor.name}</span> : <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full font-extrabold">Owner / Head</span>}<p className="text-gray-400 mt-1.5">Team: <span className="font-extrabold text-gray-600">{a.connectedAdvisors?.length || 0}</span></p><p className="text-gray-400">Leads: <span className="font-extrabold text-indigo-600">{isDateFiltered ? aFiltered.length : aLeads.length}</span>{isDateFiltered && <span className="text-gray-400"> (filtered)</span>}</p></td>
                      <td className="p-4 text-right"><p className="font-black text-emerald-600">{inr(a.totalBusiness)}</p></td>
                      <td className="p-4 text-right"><p className="font-extrabold text-blue-600">{inr(a.selfBusiness)}</p></td>
                      <td className="p-4 text-[14px] text-gray-500"><p>{fmt(a.date)}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {tab === 4 && (() => {
          const emiCustomers = customers.filter(c => {
            const st = (c.status || '').toUpperCase();
            return ['BOOKED', 'REGISTERED', 'PENDING_REGISTRATION'].includes(st);
          });
          const today = new Date();
          const overdue = (c) => {
            if (!c.payments || c.payments.length === 0) return (c.amountPaid || 0) < (c.finalAmount || 0);
            const last = new Date(Math.max(...c.payments.map(p => new Date(p.date))));
            const daysSince = (today - last) / (1000 * 60 * 60 * 24);
            return daysSince > 30 && (c.amountPaid || 0) < (c.finalAmount || 0);
          };
          // expEmi and setExpEmi come from top-level state — no hooks inside here
          const groups = {
            overdue: emiCustomers.filter(c => overdue(c)),
            pending: emiCustomers.filter(c => !overdue(c) && (c.amountPaid || 0) < (c.finalAmount || 0)),
            paid: emiCustomers.filter(c => (c.amountPaid || 0) >= (c.finalAmount || 0))
          };
          const fmtDT = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                  <p className="text-[14px] font-black text-red-400 uppercase tracking-widest mb-1">Overdue ({'>'}30 days)</p>
                  <p className="text-3xl font-black text-red-600">{groups.overdue.length}</p>
                  <p className="text-[14px] text-red-400 mt-1">{inr(groups.overdue.reduce((s, c) => s + ((c.finalAmount || 0) - (c.amountPaid || 0)), 0))} pending</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
                  <p className="text-[14px] font-black text-orange-400 uppercase tracking-widest mb-1">Active Pending</p>
                  <p className="text-3xl font-black text-orange-600">{groups.pending.length}</p>
                  <p className="text-[14px] text-orange-400 mt-1">{inr(groups.pending.reduce((s, c) => s + ((c.finalAmount || 0) - (c.amountPaid || 0)), 0))} pending</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                  <p className="text-[14px] font-black text-emerald-400 uppercase tracking-widest mb-1">Fully Paid</p>
                  <p className="text-3xl font-black text-emerald-600">{groups.paid.length}</p>
                  <p className="text-[14px] text-emerald-400 mt-1">Payments complete</p>
                </div>
              </div>

              {/* Payment Table */}
              {[['🔴 Overdue Cases', groups.overdue, 'red'], ['🟠 Active Pending', groups.pending, 'orange'], ['🟢 Fully Paid', groups.paid, 'emerald']].map(([label, group, color]) => group.length === 0 ? null : (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className={`px-6 py-4 border-b border-${color}-100 bg-${color}-50/50`}>
                    <h3 className={`text-[16px] font-black text-${color}-800 uppercase tracking-widest`}>{label} — {group.length}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[16px] text-left">
                      <thead className="bg-gray-50 text-gray-400 text-[12px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-5 py-3">Customer</th>
                          <th className="px-5 py-3">Advisor</th>
                          <th className="px-5 py-3 text-right">Total</th>
                          <th className="px-5 py-3 text-right">Paid</th>
                          <th className="px-5 py-3 text-right">Pending</th>
                          <th className="px-5 py-3 text-center">Mode / EMI</th>
                          <th className="px-5 py-3 text-center">Last Pmt</th>
                          <th className="px-5 py-3 text-center">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {group.map((c, i) => (
                          <React.Fragment key={c._id || i}>
                            <tr className={`hover:bg-${color}-50/20 transition-colors`}>
                              <td className="px-5 py-3"><p className="font-extrabold text-slate-900">{c.name}</p><p className="text-[12px] text-slate-400">{c.projectName} · Plot {c.plotNumber}</p></td>
                              <td className="px-5 py-3 text-[14px] text-slate-600">{c.advisor?.name || c.advisor || '—'}</td>
                              <td className="px-5 py-3 text-right font-extrabold text-slate-700">{inr(c.finalAmount)}</td>
                              <td className="px-5 py-3 text-right font-black text-emerald-600">{inr(c.amountPaid)}</td>
                              <td className={`px-5 py-3 text-right font-black text-${color}-600`}>{inr((c.finalAmount || 0) - (c.amountPaid || 0))}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`text-[12px] font-black uppercase px-2 py-0.5 rounded-full ${(c.paymentMode || '').toUpperCase() === 'EMI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{c.paymentMode || '—'}</span>
                                {c.emi > 0 && <p className="text-[12px] font-extrabold text-slate-500 mt-0.5">{inr(c.emi)}/mo</p>}
                              </td>
                              <td className="px-5 py-3 text-center text-[14px] text-slate-500">{c.payments?.length > 0 ? fmt(new Date(Math.max(...c.payments.map(p => new Date(p.date))))) : '—'}</td>
                              <td className="px-5 py-3 text-center"><button onClick={() => setExpEmi(expEmi === (c._id || i) ? null : (c._id || i))} className={`px-3 py-1.5 rounded-lg text-[14px] font-extrabold bg-${color}-100 hover:bg-${color}-200 text-${color}-700`}>{expEmi === (c._id || i) ? '▲ Hide' : '▼ Show'}</button></td>
                            </tr>
                            {expEmi === (c._id || i) && (
                              <tr><td colSpan={8} className="p-0 bg-slate-50/50">
                                <div className="px-6 py-6 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 shadow-sm`}>
                                        <RiHistoryLine size={18} />
                                      </div>
                                      <h4 className="text-[16px] font-black text-slate-700 uppercase tracking-wider">Transaction History — {c.name}</h4>
                                    </div>
                                    <span className="text-[12px] font-black uppercase bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500 shadow-sm">
                                      {c.payments?.length || 0} Payments Recorded
                                    </span>
                                  </div>
                                  
                                  {!c.payments?.length ? (
                                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                                      <p className="text-[14px] text-slate-400 italic">No payments have been recorded for this customer yet.</p>
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                      <table className="w-full text-[14px] text-left">
                                        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                                          <tr>
                                            <th className="px-5 py-3 w-16">#</th>
                                            <th className="px-5 py-3">Date &amp; Time</th>
                                            <th className="px-5 py-3 text-right">Amount Received</th>
                                            <th className="px-5 py-3">Note / Remarks</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {[...c.payments].sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, pi) => {
                                            const isBooking = (c.bookingAmount || 0) > 0 && (p.amount || 0) === (c.bookingAmount || 0) && (pi === c.payments.length - 1); // rough guess for earliest match
                                            return (
                                              <tr key={pi} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-5 py-3 text-slate-400 font-extrabold">#{c.payments.length - pi}</td>
                                                <td className="px-5 py-3">
                                                  <div className="flex items-center gap-2">
                                                    <RiTimeLine className="text-slate-300" />
                                                    <span className="font-extrabold text-slate-700">{fmtDT(p.date)}</span>
                                                  </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                  <div className="flex flex-col items-end">
                                                    <span className="font-black text-emerald-600 text-[16px]">{inr(p.amount)}</span>
                                                    {isBooking && (
                                                      <span className="text-[12px] font-black uppercase text-blue-500 tracking-tighter mt-0.5">💰 Booking Amount</span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                  <div className="flex items-start gap-2 max-w-xs">
                                                    <RiInformationLine className="text-slate-200 mt-0.5 shrink-0" />
                                                    <span className="text-slate-500 italic leading-relaxed">{p.note || 'No additional notes provided.'}</span>
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                        <tfoot className="bg-slate-50/30 border-t border-slate-100">
                                           <tr>
                                              <td colSpan={2} className="px-5 py-3 text-slate-500 font-black uppercase tracking-widest">Total Value Received</td>
                                              <td className="px-5 py-3 text-right font-black text-emerald-700 text-[18px]">{inr(c.amountPaid)}</td>
                                              <td className="px-5 py-3 text-right text-slate-400 font-extrabold">({Math.round(((c.amountPaid || 0) / (c.finalAmount || 1)) * 100)}% of total)</td>
                                           </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── TAB 5: COMMISSION BREAKDOWN ── */}
        {tab === 5 && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2rem] p-6 lg:p-8 mb-8 overflow-hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-800">Commission Breakdown — Per Sale</h2>
              <p className="text-[16px] text-gray-500 mt-1">Full upline chain for every sale — who earned, who was skipped, and why.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[16px] text-left">
                <thead className="bg-gray-50 text-gray-400 text-[12px] font-black uppercase tracking-widest sticky top-0">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3 text-right">Sale Amount</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Advisor (Seller)</th>
                    <th className="px-5 py-3 min-w-[380px]">Commission Chain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.filter(c => (c.commissionDistribution || []).length > 0).map((c, ci) => (
                    <tr key={ci} className="hover:bg-slate-50 transition-colors align-top">
                      <td className="px-5 py-3"><p className="font-extrabold text-slate-900">{c.name}</p><p className="text-[12px] text-slate-400">{c.projectName} · Plot {c.plotNumber}</p></td>
                      <td className="px-5 py-3 text-right font-black text-slate-700">{inr(c.finalAmount)}</td>
                      <td className="px-5 py-3 text-[14px] text-slate-500">{fmt(c.bookingDate || c.actualDate)}</td>
                      <td className="px-5 py-3 text-[14px] font-extrabold text-slate-700">
                        {(() => {
                          const seller = (c.commissionDistribution || []).find(d => d.isDirectSale);
                          return seller ? <span>{seller.advisor?.name || '—'}<br /><span className="text-indigo-500 font-black">{seller.percent}%</span></span> : '—';
                        })()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          {(c.commissionDistribution || []).map((d, di) => {
                            const isEl = d.eligible !== false;
                            const name = d.advisor?.name || `Advisor ${di + 1}`;
                            return (
                              <div key={di} className={`rounded-xl px-3 py-1.5 border text-[14px] flex flex-col items-start min-w-[120px] ${isEl ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 opacity-70'}`}>
                                <span className={`font-black ${isEl ? 'text-emerald-800' : 'text-red-600 line-through'}`}>{name}</span>
                                <span className={`font-extrabold ${isEl ? 'text-emerald-600' : 'text-red-400'}`}>{d.percent}% → {inr(d.earnedAmount)}</span>
                                {d.isDirectSale && <span className="text-[12px] text-blue-500 font-black uppercase">Seller</span>}
                                {!d.isDirectSale && <span className={`text-[12px] font-black uppercase ${isEl ? 'text-emerald-500' : 'text-red-400'}`}>{isEl ? '✓ Eligible' : '✗ Skipped'}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.filter(c => (c.commissionDistribution || []).length > 0).length === 0 && (
                <p className="text-center text-gray-400 italic py-16">No commission data available yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: PAYOUT TRACKING ── */}
        {tab === 6 && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2rem] p-6 lg:p-8 mb-8 overflow-hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-800">Payout Tracking — Advisor-wise</h2>
              <p className="text-[16px] text-gray-500 mt-1">Commission Earned vs Released vs Paid Out vs Balance Owed for each advisor.</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
              <table className="w-full text-[16px] text-left">
                <thead className="bg-gray-50 text-gray-400 text-[12px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-4">Advisor</th>
                    <th className="px-5 py-4 text-right text-indigo-500">Comm. Earned</th>
                    <th className="px-5 py-4 text-right text-emerald-500">Comm. Released</th>
                    <th className="px-5 py-4 text-right text-yellow-600">Paid Out by Company</th>
                    <th className="px-5 py-4 text-right text-orange-500">Balance Owed</th>
                    <th className="px-5 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {advisors.map(a => {
                    // Aggregate across all customers this advisor appears in
                    let totalEarned = 0, totalReleased = 0, totalPaidOut = 0;
                    customers.forEach(c => {
                      (c.commissionDistribution || []).forEach(d => {
                        const did = (d.advisor?._id || d.advisor || '').toString();
                        if (did === a._id.toString() && d.eligible !== false) {
                          totalEarned += d.earnedAmount || 0;
                          totalReleased += d.releasedAmount || 0;
                        }
                      });
                      (c.advisorPayouts || []).forEach(p => {
                        const pid = (p.advisor?._id || p.advisor || '').toString();
                        if (pid === a._id.toString()) totalPaidOut += p.amount || 0;
                      });
                    });
                    const balanceOwed = Math.max(0, totalReleased - totalPaidOut);
                    if (totalEarned === 0 && totalReleased === 0 && totalPaidOut === 0) return null;
                    return (
                      <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-slate-900">{a.name}</p>
                          <p className="text-[12px] text-slate-400">{a.advisorId} · {a.email}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-indigo-600">{inr(totalEarned)}</td>
                        <td className="px-5 py-4 text-right font-black text-emerald-600">{inr(totalReleased)}</td>
                        <td className="px-5 py-4 text-right font-black text-yellow-600">{inr(totalPaidOut)}</td>
                        <td className="px-5 py-4 text-right font-black text-orange-600">{inr(balanceOwed)}</td>
                        <td className="px-5 py-4 text-center">
                          {balanceOwed === 0
                            ? <span className="text-[12px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Settled</span>
                            : <span className="text-[12px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⏳ Pending</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr className="font-black text-[16px]">
                    <td className="px-5 py-4 text-gray-600">GRAND TOTAL</td>
                    <td className="px-5 py-4 text-right text-indigo-600">{inr(customers.reduce((s, c) => (c.commissionDistribution || []).filter(d => d.eligible !== false).reduce((ss, d) => ss + (d.earnedAmount || 0), s), 0))}</td>
                    <td className="px-5 py-4 text-right text-emerald-600">{inr(customers.reduce((s, c) => (c.commissionDistribution || []).filter(d => d.eligible !== false).reduce((ss, d) => ss + (d.releasedAmount || 0), s), 0))}</td>
                    <td className="px-5 py-4 text-right text-yellow-600">{inr(customers.reduce((s, c) => (c.advisorPayouts || []).reduce((ss, p) => ss + (p.amount || 0), s), 0))}</td>
                    <td className="px-5 py-4 text-right text-orange-600">{inr(Math.max(0, customers.reduce((s, c) => (c.commissionDistribution || []).filter(d => d.eligible !== false).reduce((ss, d) => ss + (d.releasedAmount || 0), s), 0) - customers.reduce((s, c) => (c.advisorPayouts || []).reduce((ss, p) => ss + (p.amount || 0), s), 0)))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 7: TRANSACTION LOGS ── */}
        {tab === 7 && (() => {
          const fmtDT2 = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
          const logs = [];
          customers.forEach(c => {
            const cName = c.name;
            const adv = c.advisor?.name || '—';
            // Skip the payment that represents the booking — it is already captured as a BOOKING entry
            let bookingAmtToSkip = c.bookingAmount || 0;
            let skippedBooking = false;

            // Sort payments by date to ensure we skip the earliest matching one (usually the booking)
            const sortedPmts = [...(c.payments || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

            sortedPmts.forEach(p => {
              const pAmt = p.amount || 0;
              // If this payment matches the booking amount and we haven't skipped it yet, dedup it
              if (bookingAmtToSkip > 0 && !skippedBooking && pAmt === bookingAmtToSkip) {
                skippedBooking = true;
                return;
              }
              logs.push({ type: 'PAYMENT', date: new Date(p.date), customer: cName, advisor: adv, amount: pAmt, note: p.note || '', detail: `Payment — ${c.projectName} Plot ${c.plotNumber}` });
            });
            (c.advisorPayouts || []).forEach(p => {
              const pAdvId = (p.advisor?._id || p.advisor || '').toString();
              const foundAdv = advisors.find(a => a._id === pAdvId);
              const pAdvName = foundAdv ? foundAdv.name : (p.advisor?.name || pAdvId || '—');

              logs.push({ type: 'PAYOUT', date: new Date(p.date), customer: cName, advisor: pAdvName, amount: p.amount || 0, note: p.note || '', detail: `Commission Payout for ${cName}` });
            });
            if (c.bookingDate) logs.push({ type: 'BOOKING', date: new Date(c.bookingDate), customer: cName, advisor: adv, amount: c.bookingAmount || 0, note: '', detail: `Booked — ${c.paymentMode || ''} — ${c.projectName}` });
            if (c.registrationDate) logs.push({ type: 'REGISTRATION', date: new Date(c.registrationDate), customer: cName, advisor: adv, amount: 0, note: '', detail: `Registration — ${c.projectName}` });
          });
          logs.sort((a, b) => b.date - a.date);
          const TYPE_COLORS = { PAYMENT: 'bg-emerald-100 text-emerald-700', PAYOUT: 'bg-yellow-100 text-yellow-700', BOOKING: 'bg-blue-100 text-blue-700', REGISTRATION: 'bg-purple-100 text-purple-700' };
          // logType and logSearch come from top-level state — no hooks inside here
          const filteredLogs = logs.filter(l => {
            const matchType = logType === 'ALL' || l.type === logType;
            const matchSearch = !logSearch || l.customer.toLowerCase().includes(logSearch.toLowerCase()) || l.advisor.toLowerCase().includes(logSearch.toLowerCase());
            return matchType && matchSearch;
          });
          return (
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2rem] p-6 lg:p-8 mb-8 overflow-hidden">
              <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Transaction Logs — Full Audit Trail</h2>
                  <p className="text-[16px] text-gray-500 mt-1">{logs.length} total events recorded</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['ALL', 'PAYMENT', 'PAYOUT', 'BOOKING', 'REGISTRATION'].map(t => (
                    <button key={t} onClick={() => setLogType(t)} className={`px-4 py-2 rounded-xl text-[14px] font-black uppercase transition-all ${logType === t ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t}</button>
                  ))}
                  <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search customer / advisor..." className="border border-slate-200 rounded-xl px-4 py-2 text-[14px] outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
                <table className="w-full text-[16px] text-left">
                  <thead className="bg-gray-50 text-gray-400 text-[12px] font-black uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Advisor</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLogs.map((l, li) => (
                      <tr key={li} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-[14px] text-slate-600 whitespace-nowrap">{fmtDT2(l.date)}</td>
                        <td className="px-5 py-3"><span className={`text-[12px] font-black uppercase px-2 py-0.5 rounded-full ${TYPE_COLORS[l.type] || 'bg-gray-100 text-gray-500'}`}>{l.type}</span></td>
                        <td className="px-5 py-3 font-extrabold text-slate-900">{l.customer}</td>
                        <td className="px-5 py-3 text-slate-600">{l.advisor}</td>
                        <td className={`px-5 py-3 text-right font-black ${l.type === 'PAYOUT' ? 'text-red-600' : (l.type === 'PAYMENT' || l.type === 'BOOKING' ? 'text-emerald-600' : 'text-slate-700')}`}>{l.amount > 0 ? inr(l.amount) : '—'}</td>
                        <td className="px-5 py-3 text-[14px] text-slate-500">{l.detail}{l.note ? ` · ${l.note}` : ''}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-gray-400 italic">No log entries found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ── TAB 8: LEDGER ── */}
        {tab === 8 && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2rem] p-6 lg:p-10 mb-8 max-w-full overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Payments &amp; Commission Ledger</h2>
                <p className="text-gray-500 font-extrabold text-[16px] mt-1">Track finalized transaction pay-ins and commission disbursals.</p>
              </div>
            </div>
            <LedgerTable customers={dateFilteredCustomers} isOwner={true} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white mt-8 py-4 text-center">
        <p className="text-[14px] text-gray-400">🏢 Nutan Housing Finance · Owner Panel · All data is live</p>
      </div>
    </div>
  );
}
