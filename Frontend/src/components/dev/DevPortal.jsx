import React, { useState, useEffect, useMemo } from 'react';
import { apiDev as API } from '../../config/api.js';
import { fetchDevData, authorizeRegistration, resetAdvisorTotals, getPortalCredentials, updatePortalCredential, fetchWebsiteEnquiries, deleteWebsiteEnquiry } from '../../services/devApi.js';
import { devFetch } from '../../services/authFetch.js';
import { useToast, useConfirm } from '../../context/AppProvider.jsx';
import DevLogin from './DevLogin.jsx';
import ProjectMapsTab from './ProjectMapsTab.jsx';

const TABS = ['📊 Overview', '🔔 Auth', '🧑‍💼 Advisors', '👥 Customers', '📨 Apps', '➕ New Adv', '⚙️ Settings', '🗺️ Maps', '📥 Website Leads'];

// ---- helpers ----
const inr = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusColor = (s = '') => {
  const u = s.toUpperCase();
  if (u === 'REGISTERED' || u === 'CONFIRMED') return 'text-purple-300 bg-purple-900/30 border border-purple-700/40';
  if (u === 'BOOKED') return 'text-yellow-300 bg-yellow-900/30 border border-yellow-700/40';
  if (u === 'PENDING_REGISTRATION') return 'text-orange-300 bg-orange-900/40 border border-orange-600/50 animate-pulse';
  return 'text-gray-400 bg-gray-800 border border-gray-700';
};

// CSV export
function downloadCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

function PortalSettings({ toast }) {
  const [creds, setCreds] = useState({ devUsername: '', ownerUsername: '' });
  const [editing, setEditing] = useState(null); // which field
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPortalCredentials().then(r => { if (r.ok) setCreds(r.data); });
  }, []);

  const FIELDS = [
    { key: 'devUsername',    label: 'Dev Portal Username',    icon: '🖥️', hint: 'min 4 chars',  type: 'text' },
    { key: 'devPassword',    label: 'Dev Portal Password',    icon: '🔐', hint: 'min 8 chars',  type: 'password' },
    { key: 'ownerUsername',  label: 'Owner Portal Username',  icon: '🏢', hint: 'min 4 chars',  type: 'text' },
    { key: 'ownerPassword',  label: 'Owner Portal Password',  icon: '🔐', hint: 'min 8 chars',  type: 'password' },
    { key: 'ownerSecretWord',label: 'Owner 2nd-Factor Word',  icon: '🔑', hint: 'min 4 chars',  type: 'password' },
  ];

  const handleSave = async () => {
    if (!newValue.trim()) { toast.error('Value cannot be empty.'); return; }
    setSaving(true);
    const r = await updatePortalCredential(editing, newValue.trim());
    setSaving(false);
    if (r.ok) {
      toast.success(`${editing} updated! Session tokens are now invalid — re-login required.`, 'Credential Updated');
      setEditing(null); setNewValue('');
      getPortalCredentials().then(res => { if (res.ok) setCreds(res.data); });
    } else {
      toast.error(r.error || 'Update failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 text-amber-300 text-sm font-bold">
        ⚠️ Changing credentials will immediately invalidate all active sessions. Everyone will need to log in again.
      </div>
      {FIELDS.map(f => (
        <div key={f.key} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-white font-black text-sm flex items-center gap-2">{f.icon} {f.label}</p>
            {(f.key === 'devUsername' || f.key === 'ownerUsername') && (
              <p className="text-gray-400 text-xs mt-1 font-mono">Current: <span className="text-cyan-400">{creds[f.key] || '...'}</span></p>
            )}
            {(f.key === 'devPassword' || f.key === 'ownerPassword' || f.key === 'ownerSecretWord') && (
              <p className="text-gray-500 text-xs mt-1">Stored encrypted · {f.hint}</p>
            )}
          </div>
          <button onClick={() => { setEditing(f.key); setNewValue(''); }}
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase flex-shrink-0">✏ Change</button>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-white font-black text-base mb-4">🔑 Change: {FIELDS.find(f=>f.key===editing)?.label}</h3>
            <input
              type={FIELDS.find(f=>f.key===editing)?.type || 'text'}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder={`New ${FIELDS.find(f=>f.key===editing)?.label}...`}
              autoFocus
              className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-blue-500 text-sm mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="px-5 py-2 text-gray-400 hover:text-white font-bold text-xs uppercase">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs uppercase">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DevPortal() {
  // ── Auth gate ──────────────────────────────────────────────────────────────
  const [authed, setAuthed] = useState(() => {
    const token = sessionStorage.getItem('devToken');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  });

  if (!authed) return <DevLogin onSuccess={() => setAuthed(true)} />;
  return <DevPortalInner setAuthed={setAuthed} />;
}

function DevPortalInner({ setAuthed }) {
  const [tab, setTab] = useState(0);
  const [advisors, setAdvisors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [websiteEnquiries, setWebsiteEnquiries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();
  const [showVerifyModal, setShowVerifyModal] = useState(null);
  const [hierarchySelection, setHierarchySelection] = useState('MAIN_COMPANY');
  const [customAdvisorIdV, setCustomAdvisorIdV] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [showCredsId, setShowCredsId] = useState(null);
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [viewAdvisorProfile, setViewAdvisorProfile] = useState(null);

  // Customer modals
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedPayCust, setSelectedPayCust] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payTime, setPayTime] = useState('');
  const [payNote, setPayNote] = useState('');
  // Company bonus state
  const [selectedBonusCust, setSelectedBonusCust] = useState(null);
  const [bonusAdvisorId, setBonusAdvisorId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusDate, setBonusDate] = useState('');
  const [bonusNote, setBonusNote] = useState('');
  // Compute today's date string and current time string for max constraints
  const getNow = () => {
    const now = new Date();
    const dStr = now.toISOString().split('T')[0];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return { dStr, tStr: `${hh}:${mm}` };
  };
  const [custSearch, setCustSearch] = useState('');
  const [custStatusFilter, setCustStatusFilter] = useState('ALL');

  // Create advisor form
  const [newAdv, setNewAdv] = useState({ name: '', email: '', phoneNumber: '', password: '', advisorId: '', role: 'advisor', parentAdvisorId: 'MAIN_COMPANY' });
  const [resetting, setResetting] = useState(false);

  const handleResetTotals = async (advisorId = null, name = 'Company') => {
    const ok = await confirm({ title: 'Recalculate Earnings?', message: `WARNING: Recalculate earnings for ${name}? This override fixes database sync issues.`, confirmText: 'Yes, Recalculate', type: 'danger' });
    if (!ok) return;
    setResetting(true);
    const res = await resetAdvisorTotals(advisorId);
    setResetting(false);
    if (res.ok) {
      toast.success(`Sync completed for ${name}`, 'Sync Successful');
      fetchData();
    } else {
      toast.error(`Sync Failed: ${res.error}`, 'Error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    const result = await fetchDevData();
    if (result.ok && result.data) {
      setAdvisors(result.data.advisors);
      setCustomers(result.data.customers);
      setApplications(result.data.applications);
      setStats(result.data.stats);

      const enqRes = await fetchWebsiteEnquiries();
      if (enqRes.ok) setWebsiteEnquiries(enqRes.data);
    } else {
      setLoadError(result.error || 'Failed to load dev data');
      setAdvisors([]);
      setCustomers([]);
      setApplications([]);
      setWebsiteEnquiries([]);
      setStats({});
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ---- ADVISOR ACTIONS ---- */
  const handleVerify = async (advisorId) => {
    const res = await devFetch(`${API}/verify`, { method: 'PUT', body: JSON.stringify({ targetAdvisorId: advisorId, parentAdvisorId: hierarchySelection, customAdvisorId: customAdvisorIdV }) });
    if (res.ok) { toast.success('Advisor verified and bound to hierarchy!', 'Verified'); setShowVerifyModal(null); setCustomAdvisorIdV(''); fetchData(); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.message || 'Verification failed.'); }
  };

  const handleResetPassword = async (advisorId) => {
    const res = await devFetch(`${API}/reset-password`, { method: 'POST', body: JSON.stringify({ targetAdvisorId: advisorId, newPassword }) });
    if (res.ok) { toast.success('Password overridden successfully!', 'Password Reset'); setShowPasswordModal(null); setNewPassword(''); fetchData(); }
    else toast.error('Failed — password must be 5+ chars.');
  };

  const handleSaveAdvisor = async () => {
    const { _id, connectedAdvisors, parentAdvisor, __v, customers: c, referralCode, date, ...fields } = editingAdvisor;
    const res = await devFetch(`${API}/advisor/${_id}`, { method: 'PUT', body: JSON.stringify(fields) });
    if (res.ok) { toast.success('Advisor details saved!', 'Saved'); setEditingAdvisor(null); fetchData(); }
    else toast.error('Update failed.');
  };

  const handleDeleteAdvisor = async (id, name) => {
    const ok = await confirm({ title: 'Delete Advisor?', message: `DELETE advisor "${name}"? All their leads will be unassigned. This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' });
    if (!ok) return;
    const res = await devFetch(`${API}/advisor/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success(`${name} has been deleted.`, 'Advisor Deleted'); fetchData(); }
    else toast.error('Delete failed.');
  };

  const handleCreateAdvisor = async () => {
    const res = await devFetch(`${API}/advisor`, { method: 'POST', body: JSON.stringify(newAdv) });
    const d = await res.json();
    if (res.ok) { toast.success(`Advisor "${newAdv.name}" created successfully!`, 'Advisor Created'); setNewAdv({ name: '', email: '', phoneNumber: '', password: '', advisorId: '', role: 'advisor', parentAdvisorId: 'MAIN_COMPANY' }); fetchData(); setTab(1); }
    else toast.error(d.message || 'Creation failed.');
  };

  /* ---- CUSTOMER ACTIONS ---- */
  const handleSaveCustomer = async () => {
    const { _id, advisor, __v, actualDate, bookingDate, registrationDate, ...fields } = editingCustomer;
    const res = await devFetch(`${API}/customer/${_id}`, { method: 'PUT', body: JSON.stringify({ ...fields, advisor: typeof advisor === 'object' ? advisor?._id : advisor }) });
    if (res.ok) { toast.success('Lead updated successfully!', 'Lead Saved'); setEditingCustomer(null); fetchData(); }
    else toast.error('Update failed.');
  };

  const handleDeleteCustomer = async (id, name) => {
    const ok = await confirm({ title: 'Delete Lead?', message: `DELETE lead for "${name}"? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    const res = await devFetch(`${API}/customer/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success(`Lead for ${name} deleted.`, 'Lead Deleted'); fetchData(); }
    else toast.error('Delete failed.');
  };

  const handlePaySubmit = async () => {
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    if (!payDate) {
      toast.error('Please select a payment date.');
      return;
    }
    // Combine date + time into ISO string
    const timeStr = payTime || '00:00';
    const paymentDate = new Date(`${payDate}T${timeStr}:00`);
    if (isNaN(paymentDate.getTime()) || paymentDate > new Date()) {
      toast.error('Payment date/time cannot be in the future.');
      return;
    }
    const res = await devFetch(`${API}/customer/${selectedPayCust._id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(payAmount), paymentDate: paymentDate.toISOString(), note: payNote })
    });
    if (res.ok) {
       toast.success(`Payment of ${inr(payAmount)} recorded on ${payDate} at ${timeStr}!`, 'Payment Recorded');
       setSelectedPayCust(null);
       setPayAmount(''); setPayDate(''); setPayTime(''); setPayNote('');
       fetchData();
    } else {
       const d = await res.json().catch(() => ({}));
       toast.error(d.message || 'Failed to record payment.');
    }
  };

  const resetBonus = () => { setSelectedBonusCust(null); setBonusAdvisorId(''); setBonusAmount(''); setBonusDate(''); setBonusNote(''); };
  const handleBonusSubmit = async () => {
    if (!bonusAdvisorId) { toast.error('Please select an advisor.'); return; }
    if (!bonusAmount || isNaN(bonusAmount) || Number(bonusAmount) <= 0) { toast.error('Enter a valid payout amount.'); return; }
    if (!bonusDate) { toast.error('Please select a payout date.'); return; }
    const res = await devFetch(`${API}/customer/${selectedBonusCust._id}/advisor-payout`, {
      method: 'POST',
      body: JSON.stringify({ advisorId: bonusAdvisorId, amount: Number(bonusAmount), payoutDate: bonusDate, note: bonusNote })
    });
    if (res.ok) {
      toast.success(`Commission payout of ${inr(bonusAmount)} recorded!`, 'Payout Recorded');
      resetBonus(); fetchData();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.message || 'Failed to record payout.');
    }
  };

  /* ---- APPLICATION ACTIONS ---- */
  const handleDeleteApp = async (id) => {
    const ok = await confirm({ title: 'Delete Application?', message: 'Are you sure you want to delete this application enquiry?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    const res = await devFetch(`${API}/application/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Application deleted.', 'Deleted'); fetchData(); }
  };

  /* ---- WEBSITE ENQUIRIES ACTIONS ---- */
  const handleDeleteEnquiry = async (id) => {
    const ok = await confirm({ title: 'Delete Lead?', message: 'Delete this website enquiry lead?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    const res = await deleteWebsiteEnquiry(id);
    if (res.ok) { toast.success('Lead deleted.', 'Deleted'); fetchData(); }
    else toast.error('Failed to delete.');
  };

  /* ---- AUTHORIZATION ACTIONS ---- */
  const handleAuthAction = async (id, action) => {
    const res = await authorizeRegistration(id, action);
    if (res.ok) {
      toast.success(action === 'APPROVE' ? 'Registration Authorized!' : 'Registration Rejected.', action === 'APPROVE' ? 'Approved ✓' : 'Rejected');
      fetchData();
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  /* ---- FILTERED DATA ---- */
  const filteredAdvisors = useMemo(() => advisors.filter(a =>
    !advisorSearch || a.name?.toLowerCase().includes(advisorSearch.toLowerCase()) || a.email?.toLowerCase().includes(advisorSearch.toLowerCase()) || a.advisorId?.toLowerCase().includes(advisorSearch.toLowerCase())
  ), [advisors, advisorSearch]);

  const filteredCustomers = useMemo(() => customers.filter(c => {
    const matchSearch = !custSearch || c.name?.toLowerCase().includes(custSearch.toLowerCase()) || c.email?.toLowerCase().includes(custSearch.toLowerCase()) || c.phoneNumber?.includes(custSearch);
    const matchStatus = custStatusFilter === 'ALL' || (c.status || '').toUpperCase() === custStatusFilter;
    return matchSearch && matchStatus;
  }), [customers, custSearch, custStatusFilter]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-2xl font-black animate-pulse">⚡ Initializing Override Console...</div>;

  const sc = stats.statusCounts || {};
  const rev = stats.revenueByAdvisor || [];

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100">
      {/* Toast notifications are handled globally by AppProvider */}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        {/* Logout */}
        <div className="flex-1 w-full">
          <h1 className="text-2xl xl:text-3xl font-black text-white tracking-widest uppercase">⚡ System Override Portal</h1>
          <p className="text-red-400 font-bold text-xs mt-1 uppercase tracking-wider">Superadmin Privilege Only — Dangerous Zone</p>
          {loadError && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-100 text-sm space-y-2">
              <p className="font-bold">Could not load data from the API</p>
              <p className="opacity-90">{loadError}</p>
              <button type="button" onClick={fetchData} className="bg-red-800 hover:bg-red-700 px-4 py-2 rounded-lg font-bold text-white text-xs uppercase">Retry</button>
            </div>
          )}
          {!loadError && advisors.length === 0 && customers.length === 0 && applications.length === 0 && (
            <p className="mt-3 text-amber-300/90 text-xs font-semibold border border-amber-800/50 bg-amber-950/30 rounded-lg px-3 py-2">
              No advisors, leads, or applications in the database yet — or you are pointed at an empty environment.
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => { sessionStorage.removeItem('devToken'); setAuthed(false); }}
            className="bg-gray-800 hover:bg-red-900 border border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-300 font-bold px-3 py-2 rounded-lg text-xs uppercase transition-all">
            🚪 Logout
          </button>
          {[
            { label: 'Advisors', val: advisors.length, color: 'text-blue-400' },
            { label: 'Total Leads', val: customers.length, color: 'text-green-400' },
            { label: 'Waiting', val: sc.WAITING || 0, color: 'text-gray-300' },
            { label: 'Booked', val: sc.BOOKED || 0, color: 'text-yellow-400' },
            { label: 'Registered', val: sc.REGISTERED || 0, color: 'text-purple-400' },
            { label: 'Applications', val: applications.length, color: 'text-pink-400' },
            { label: 'Revenue', val: inr(stats.totalRevenue || 0), color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg text-center min-w-[90px]">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{s.label}</p>
              <p className={`text-base font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-700 bg-gray-900 px-2 relative overflow-hidden">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-3 py-3 font-bold text-[10px] uppercase tracking-tighter whitespace-nowrap transition-colors border-b-2 ${tab === i ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-8 max-w-screen-2xl mx-auto">

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === 0 && (
          <div className="space-y-6">
            {/* Revenue by advisor */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">💰 Revenue Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                    <th className="pb-2 text-left">Advisor</th>
                    <th className="pb-2 text-right">Total Business</th>
                    <th className="pb-2 text-right">Self Business</th>
                    <th className="pb-2 text-center">Team Size</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {[...rev].filter(a => a.verified).sort((a,b) => b.totalBusiness - a.totalBusiness).map((a,i) => (
                      <tr key={i} className="hover:bg-gray-700/30">
                        <td className="py-2 font-bold text-white">{a.name} {a.advisorId && <span className="text-yellow-400 text-xs ml-1">{a.advisorId}</span>}</td>
                        <td className="py-2 text-right text-emerald-400 font-bold">{inr(a.totalBusiness)}</td>
                        <td className="py-2 text-right text-blue-400">{inr(a.selfBusiness)}</td>
                        <td className="py-2 text-center text-gray-300">{a.teamSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lead status + advisor cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(sc).map(([s, cnt]) => (
                <div key={s} className={`rounded-xl p-5 text-center font-black ${statusColor(s)}`}>
                  <p className="text-3xl">{cnt}</p>
                  <p className="text-xs uppercase tracking-widest mt-1">{s}</p>
                </div>
              ))}
            </div>

            {/* Recent leads */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">🕐 Recent 10 Leads</h2>
              <div className="space-y-2">
                {[...customers].slice(-10).reverse().map(c => (
                  <div key={c._id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-900 hover:bg-gray-700/40 text-sm">
                    <div>
                      <span className="text-white font-bold mr-2">{c.name}</span>
                      <span className="text-gray-500 text-xs">{c.projectName} | Plot {c.plotNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-300 font-bold text-xs">{inr(c.finalAmount)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusColor(c.status)}`}>{(c.status||'WAITING').toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ AUTHORIZATIONS TAB ═══ */}
        {tab === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-orange-950/20 border border-orange-900/30 p-4 rounded-xl">
               <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">🔔 Pending Site Registrations</h2>
                  <p className="text-gray-400 text-xs">Verify full payment receipt before authorizing these registrations.</p>
               </div>
               <div className="bg-orange-600 text-white font-black px-3 py-1 rounded-lg animate-bounce">
                  {customers.filter(c => c.status === 'PENDING_REGISTRATION').length}
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {customers.filter(c => c.status === 'PENDING_REGISTRATION').length === 0 ? (
                 <div className="py-20 text-center bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">No registrations awaiting authorization</p>
                 </div>
               ) : (
                 customers.filter(c => c.status === 'PENDING_REGISTRATION').map(c => (
                   <div key={c._id} className="bg-gray-800 border border-orange-900/40 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-orange-600/50 transition-all shadow-xl">
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-black text-white">{c.name}</span>
                            <span className="bg-orange-900/30 text-orange-400 border border-orange-700/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Pending Site Reg</span>
                         </div>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div><p className="text-gray-500 font-bold uppercase tracking-wider">Project</p><p className="text-gray-200 font-bold">{c.projectName}</p></div>
                            <div><p className="text-gray-500 font-bold uppercase tracking-wider">Plot / Size</p><p className="text-gray-200 font-bold">{c.plotNumber} / {c.plotSize}</p></div>
                            <div><p className="text-gray-500 font-bold uppercase tracking-wider">Final Amount</p><p className="text-emerald-400 font-black text-sm">{inr(c.finalAmount)}</p></div>
                            <div><p className="text-gray-500 font-bold uppercase tracking-wider">Advisor</p><p className="text-blue-400 font-bold">{c.advisor?.name || 'Unknown'}</p></div>
                         </div>
                      </div>

                      <div className="flex gap-3 w-full md:w-auto">
                         <button onClick={() => handleAuthAction(c._id, 'REJECT')}
                           className="flex-1 md:flex-none px-6 py-3 bg-gray-950 border border-red-900/50 text-red-500 font-black rounded-xl hover:bg-red-950/20 transition-all text-xs uppercase">
                           Reject
                         </button>
                         <button onClick={() => handleAuthAction(c._id, 'APPROVE')}
                           className="flex-1 md:flex-none px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-lg shadow-orange-900/40 transition-all scale-105 hover:scale-110 active:scale-95 text-xs uppercase">
                           Authorize Registration
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* ═══ ADVISORS TAB ═══ */}
        {tab === 2 && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <input value={advisorSearch} onChange={e => setAdvisorSearch(e.target.value)}
                placeholder="🔍 Search by name, email or ID..."
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg outline-none text-sm w-64 focus:border-blue-500" />
              <button onClick={() => downloadCSV(advisors.map(a => ({ Name: a.name, Email: a.email, Phone: a.phoneNumber, AdvisorID: a.advisorId || '', Verified: a.verified, PAN: a.pan, Aadhar: a.aadhar, TotalBusiness: a.totalBusiness || 0, SelfBusiness: a.selfBusiness || 0 })), 'advisors.csv')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider">
                ⬇ Export CSV
              </button>
              <button onClick={() => setTab(4)} className="bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider">
                + Create New Advisor
              </button>
              <span className="text-gray-500 text-xs ml-auto">{filteredAdvisors.length} of {advisors.length} shown</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-2xl">
              <table className="w-full text-left bg-gray-900">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-widest font-black">
                  <tr>
                    <th className="p-4">Advisor</th>
                    <th className="p-4">Credentials 👁</th>
                    <th className="p-4">KYC Details</th>
                    <th className="p-4">Hierarchy</th>
                    <th className="p-4">Business</th>
                    <th className="p-4">Badge / Dates</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {filteredAdvisors.map(adv => (
                    <tr key={adv._id} className="hover:bg-gray-800/50 transition-colors align-top">
                      <td className="p-4">
                        <p className="text-white font-bold text-base">{adv.name}</p>
                        <p className="text-[10px] text-gray-600 font-mono break-all mt-0.5">{adv._id}</p>
                        {adv.advisorId && <p className="text-xs text-yellow-400 font-black uppercase tracking-widest mt-1">{adv.advisorId}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{adv.phoneNumber}</p>
                        {adv.referralCode && <p className="text-xs text-cyan-500 mt-0.5">Ref: {adv.referralCode}</p>}
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-gray-300 font-mono">{adv.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="text-white font-mono bg-gray-900 px-2 py-1 rounded text-[11px] tracking-wider w-full overflow-hidden text-ellipsis whitespace-nowrap">
                              {showCredsId === adv._id ? adv.passwordPlain || '—' : '••••••••'}
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setShowCredsId(showCredsId === adv._id ? null : adv._id); }}
                            className="text-gray-500 hover:text-yellow-300 transition-colors text-base flex-shrink-0">
                            {showCredsId === adv._id ? '🙈' : '👁'}
                          </button>
                      </td>
                      <td className="p-4 text-xs">
                        <p>PAN: <span className="text-white font-mono">{adv.pan || 'Not Provided'}</span></p>
                        <p className="mt-0.5">Aadhar: <span className="text-white font-mono">{adv.aadhar || 'Not Provided'}</span></p>
                        <p className="text-gray-500 mt-1 text-[11px] max-w-[140px] break-words">{adv.address || '—'}</p>
                      </td>
                      <td className="p-4">
                        {adv.parentAdvisor
                          ? <span className="text-blue-400 text-xs bg-blue-900/30 border border-blue-800/40 px-2 py-1 rounded-full">↳ {adv.parentAdvisor.name}</span>
                          : <span className="text-purple-400 text-xs bg-purple-900/30 border border-purple-800/40 px-2 py-1 rounded-full">Company Root</span>}
                        <p className="text-xs text-gray-500 mt-2">Team: <span className="text-white font-bold">{adv.connectedAdvisors?.length || 0}</span></p>
                        <p className="text-xs text-gray-500">Role: <span className="text-gray-300">{adv.role}</span></p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-emerald-400 font-black">{inr(adv.totalBusiness)}</p>
                        <p className="text-gray-400">total business</p>
                        <p className="text-blue-400 font-bold mt-1">{inr(adv.selfBusiness)}</p>
                        <p className="text-gray-400">self</p>
                        <p className="text-indigo-400 mt-1">{inr(adv.teamBusiness || 0)}</p>
                        <p className="text-gray-400">team</p>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="px-2 py-1 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300 font-bold">{adv.badge || 'Bronze'}</span>
                        <p className="text-gray-500 mt-2">Joined: {fmt(adv.date)}</p>
                        <p className="text-gray-500">Slab: {adv.currentSlab || 0}</p>
                      </td>
                      <td className="p-4">
                        {adv.verified
                          ? <span className="text-green-400 font-black text-xs flex items-center gap-1">✅ LIVE</span>
                          : <span className="text-red-400 animate-pulse font-black text-xs flex items-center gap-1">❌ PENDING</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-end min-w-[110px]">
                          {!adv.verified && (
                            <button onClick={(e) => { e.stopPropagation(); setShowVerifyModal(adv); setHierarchySelection('MAIN_COMPANY'); }}
                              className="bg-green-700 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded text-xs uppercase w-full text-center">Verify & Bind</button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setShowPasswordModal(adv); setNewPassword(''); }}
                            className="bg-orange-700 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded text-xs uppercase w-full text-center">🔐 Password</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ CUSTOMERS / LEADS TAB ═══ */}
        {tab === 3 && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <input value={custSearch} onChange={e => setCustSearch(e.target.value)}
                placeholder="🔍 Search name, email or phone..."
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg outline-none text-sm w-64 focus:border-blue-500" />
              <select value={custStatusFilter} onChange={e => setCustStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg outline-none text-sm">
                <option value="ALL">All Statuses</option>
                <option value="WAITING">Waiting</option>
                <option value="BOOKED">Booked</option>
                <option value="REGISTERED">Registered</option>
              </select>
              <button onClick={() => downloadCSV(filteredCustomers.map(c => ({
                Name: c.name, Phone: c.phoneNumber, Email: c.email, Aadhar: c.aadhar, Address: c.address,
                Project: c.projectName, Plot: c.plotNumber, Block: c.block || '', PlotSize: c.plotSize,
                Status: c.status, FinalAmount: c.finalAmount || 0, BookingAmount: c.bookingAmount || 0,
                AmountPaid: c.amountPaid ?? c.bookingAmount ?? 0, Balance: Math.max(0, (c.finalAmount || 0) - (c.amountPaid ?? c.bookingAmount ?? 0)),
                PaymentMode: c.paymentMode || '', Tenure: c.tenure || '', EMI: c.emi || '',
                Advisor: c.advisor?.name || '', BookingDate: fmt(c.bookingDate), RegistrationDate: fmt(c.registrationDate)
              })), 'leads.csv')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider">
                ⬇ Export CSV
              </button>
              <span className="text-gray-500 text-xs ml-auto">{filteredCustomers.length} of {customers.length} shown</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-2xl">
              <table className="w-full text-left bg-gray-900">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-widest font-black">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Contact & KYC</th>
                    <th className="p-4">Project / Plot</th>
                    <th className="p-4">Financials</th>
                    <th className="p-4">EMI Details</th>
                    <th className="p-4">Advisor</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {filteredCustomers.map(c => (
                    <tr key={c._id} className="hover:bg-gray-800/50 transition-colors align-top">
                      <td className="p-4">
                        <p className="text-white font-bold">{c.name}</p>
                        <p className="text-[10px] text-gray-600 font-mono break-all mt-0.5">{c._id}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[140px] break-words">{c.address || '—'}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-white font-bold">{c.phoneNumber}</p>
                        <p className="text-gray-400">{c.email}</p>
                        <p className="text-gray-500 mt-1 font-mono">Aadhar: {c.aadhar}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-white font-bold">{c.projectName}</p>
                        <p className="text-gray-400">Plot: <span className="text-white">{c.plotNumber}</span></p>
                        <p className="text-gray-400">Size: <span className="text-white">{c.plotSize}</span></p>
                        {c.block && <p className="text-gray-400">Block: <span className="text-white">{c.block}</span></p>}
                        {c.price && <p className="text-gray-400">Rate: <span className="text-white">{inr(c.price)}/sqft</span></p>}
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-yellow-300 font-black">Final: {inr(c.finalAmount)}</p>
                        <p className="text-green-400 mt-0.5">Paid: {inr(c.amountPaid ?? c.bookingAmount)}</p>
                        <p className="text-red-400 mt-0.5">Balance: {inr(Math.max(0, (c.finalAmount || 0) - (c.amountPaid ?? c.bookingAmount ?? 0)))}</p>
                        {c.extraCharges > 0 && <p className="text-orange-400">Extra: {inr(c.extraCharges)}</p>}
                        <p className="text-gray-500">Base: {inr(c.baseAmount)}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-gray-300">{c.paymentMode || '—'}</p>
                        {c.tenure > 0 && <p className="text-gray-400">Tenure: <span className="text-white">{c.tenure}m</span></p>}
                        {c.emi > 0 && <p className="text-blue-400 font-bold">EMI: {inr(c.emi)}/mo</p>}
                      </td>
                      <td className="p-4 text-xs">
                        {c.advisor ? (
                          <>
                            <p className="text-white font-bold">{c.advisor.name}</p>
                            {c.advisor.advisorId && <p className="text-yellow-400">{c.advisor.advisorId}</p>}
                            <p className="text-gray-500 text-[11px]">{c.advisor.email}</p>
                          </>
                        ) : <span className="text-red-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-4 text-xs text-gray-400">
                        <p>Created: <span className="text-white">{fmt(c.actualDate)}</span></p>
                        {c.bookingDate && <p className="mt-0.5">Booked: <span className="text-yellow-300">{fmt(c.bookingDate)}</span></p>}
                        {c.registrationDate && <p className="mt-0.5">Reg: <span className="text-purple-300">{fmt(c.registrationDate)}</span></p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${statusColor(c.status)}`}>
                          {(c.status || 'WAITING').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-end min-w-[90px]">
                          {['BOOKED', 'PENDING_REGISTRATION', 'REGISTERED'].includes((c.status || '').toUpperCase()) && (c.amountPaid || c.bookingAmount || 0) < c.finalAmount && (
                            <button onClick={() => { setSelectedPayCust(c); setPayAmount(''); }}
                             className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded text-xs uppercase w-full text-center">💵 Payment</button>
                          )}
                          {['BOOKED', 'PENDING_REGISTRATION', 'REGISTERED'].includes((c.status || '').toUpperCase()) && (c.commissionDistribution || []).length > 0 && (
                            <button onClick={() => { setSelectedBonusCust(c); setBonusAdvisorId(''); setBonusAmount(''); setBonusDate(''); setBonusNote(''); }}
                             className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-3 py-1.5 rounded text-xs uppercase w-full text-center">💰 Payout</button>
                          )}
                          <button onClick={() => setEditingCustomer({ ...c })}
                            className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded text-xs uppercase w-full text-center">✏ Edit</button>
                          <button onClick={() => handleDeleteCustomer(c._id, c.name)}
                            className="bg-red-900 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-xs uppercase w-full text-center">🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ APPLICATIONS TAB ═══ */}
        {tab === 4 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white">📨 Job Applications ({applications.length})</h2>
              <button onClick={() => downloadCSV(applications.map(a => ({ Name: a.name, Email: a.email, Phone: a.phoneNumber, Message: a.message, Date: a.date, CV: a.cv })), 'applications.csv')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase">⬇ Export CSV</button>
            </div>
            {applications.length === 0
              ? <p className="text-gray-500 text-center py-16 italic">No applications found.</p>
              : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {applications.map(a => (
                  <div key={a._id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-black text-base">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                        <p className="text-xs text-gray-500">{a.phoneNumber}</p>
                      </div>
                      <button onClick={() => handleDeleteApp(a._id)} className="text-red-500 hover:text-red-300 text-lg font-black transition-colors">×</button>
                    </div>
                    <p className="text-xs text-gray-300 bg-gray-900 rounded-lg p-3 italic">"{a.message}"</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500">{a.date}</span>
                      {a.cv && <a href={a.cv} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 font-bold">📄 View CV →</a>}
                    </div>
                  </div>
                ))}
              </div>}
          </div>
        )}

        {/* ═══ CREATE ADVISOR TAB ═══ */}
        {tab === 5 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider">➕ Create New Advisor</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Full Name *', key: 'name', placeholder: 'e.g. Rahul Sharma' },
                  { label: 'Email *', key: 'email', placeholder: 'advisor@email.com', type: 'email' },
                  { label: 'Phone Number *', key: 'phoneNumber', placeholder: '9876543210' },
                  { label: 'Password *', key: 'password', placeholder: 'Min 5 characters', type: 'text' },
                  { label: 'Advisor ID (optional)', key: 'advisorId', placeholder: 'e.g. NH003042026' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">{f.label}</label>
                    <input type={f.type || 'text'} value={newAdv[f.key]} placeholder={f.placeholder}
                      onChange={e => setNewAdv({ ...newAdv, [f.key]: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-blue-500 text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Role</label>
                  <select value={newAdv.role} onChange={e => setNewAdv({ ...newAdv, role: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none text-sm">
                    <option value="advisor">Advisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Parent / Hierarchy</label>
                  <select value={newAdv.parentAdvisorId} onChange={e => setNewAdv({ ...newAdv, parentAdvisorId: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none text-sm">
                    <option value="MAIN_COMPANY">— Root: Direct Company Branch —</option>
                    {advisors.filter(a => a.verified).map(a => (
                      <option key={a._id} value={a._id}>{a.name} ({a.advisorId || a.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3 mb-6 text-xs text-yellow-300">
                ⚠️ Advisor will be created as <strong>verified</strong> and immediately active on the platform.
              </div>
              <button onClick={handleCreateAdvisor}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl text-sm uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-green-900/40">
                ➕ Create Advisor Now
              </button>
            </div>
          </div>
        )}

        {/* ═══ PORTAL SETTINGS TAB ═══ */}
        {tab === 6 && <PortalSettings toast={toast} />}

        {/* ═══ PROJECT MAPS TAB ═══ */}
        {tab === 7 && <ProjectMapsTab />}

        {/* ═══ WEBSITE ENQUIRIES TAB ═══ */}
        {tab === 8 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">📥 Website Enquiries ({websiteEnquiries.length})</h2>
              <button onClick={() => downloadCSV(websiteEnquiries.map(e => ({
                Date: fmt(e.createdAt), Name: e.name, Phone: e.phoneNumber, Email: e.email || '—',
                Source: e.source, Message: e.message || '—', Address: e.address || '—'
              })), 'website_leads.csv')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase">⬇ Export CSV</button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-2xl">
              <table className="w-full text-left bg-gray-900">
                <thead className="bg-gray-800 text-gray-400 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Lead Info</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Message / Address</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {websiteEnquiries.length === 0 ? (
                    <tr><td colSpan="6" className="p-20 text-center text-gray-600 italic">No website enquiries yet.</td></tr>
                  ) : (
                    websiteEnquiries.map(e => (
                      <tr key={e._id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 text-xs text-gray-400 whitespace-nowrap">{fmt(e.createdAt)}</td>
                        <td className="p-4 font-bold text-white">{e.name}</td>
                        <td className="p-4 text-xs">
                          <p className="text-white">{e.phoneNumber}</p>
                          <p className="text-gray-500">{e.email || '—'}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                            e.source === 'Career Page' ? 'bg-purple-900/30 border-purple-700 text-purple-300' :
                            e.source === 'Contact Page' ? 'bg-blue-900/30 border-blue-700 text-blue-300' :
                            'bg-yellow-900/30 border-yellow-700 text-yellow-300'
                          }`}>
                            {e.source || 'Popup'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-400 max-w-xs">
                          {e.message && <p className="italic mb-1">"{e.message}"</p>}
                          {e.address && <p className="text-[10px] opacity-60">📍 {e.address}</p>}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteEnquiry(e._id)} className="text-red-500 hover:text-red-300 text-xl font-black">×</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Verify Modal */}
      {showVerifyModal && (
        <Modal title={`✅ Verify: ${showVerifyModal.name}`} onClose={() => setShowVerifyModal(null)}>
          <Label>Custom Advisor ID</Label>
          <Input value={customAdvisorIdV} onChange={e => setCustomAdvisorIdV(e.target.value)} placeholder="e.g. NH-001 (optional)" />
          <Label className="mt-4">Parent Node</Label>
          <Select value={hierarchySelection} onChange={e => setHierarchySelection(e.target.value)}>
            <option value="MAIN_COMPANY">— Root: Direct Company Branch —</option>
            {advisors.filter(a => a.verified && a._id !== showVerifyModal._id).map(a => (
              <option key={a._id} value={a._id}>Sub of: {a.name}</option>
            ))}
          </Select>
          <ModalButtons onCancel={() => setShowVerifyModal(null)} onConfirm={() => handleVerify(showVerifyModal._id)} confirmLabel="Execute" confirmClass="bg-green-600 hover:bg-green-500" />
        </Modal>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <Modal title={`🔐 Set Password: ${showPasswordModal.name}`} onClose={() => setShowPasswordModal(null)}>
          <Label>New Password</Label>
          <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="text" placeholder="Min 5 characters..." />
          <ModalButtons onCancel={() => setShowPasswordModal(null)} onConfirm={() => handleResetPassword(showPasswordModal._id)} confirmLabel="Set Password" confirmClass="bg-red-600 hover:bg-red-500" />
        </Modal>
      )}

      {/* Edit Advisor Modal */}
      {editingAdvisor && (
        <Modal title={`✏️ Edit: ${editingAdvisor.name}`} onClose={() => setEditingAdvisor(null)} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Name', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phoneNumber' },
              { label: 'Advisor ID', key: 'advisorId' }, { label: 'PAN', key: 'pan' }, { label: 'Aadhar', key: 'aadhar' },
              { label: 'Total Business (₹)', key: 'totalBusiness', type: 'number' }, { label: 'Self Business (₹)', key: 'selfBusiness', type: 'number' },
              { label: 'Badge', key: 'badge' }, { label: 'Current Slab', key: 'currentSlab', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input type={f.type || 'text'} value={editingAdvisor[f.key] || ''}
                  onChange={e => setEditingAdvisor({ ...editingAdvisor, [f.key]: e.target.value })} />
              </div>
            ))}
            <div><Label>Address</Label><textarea value={editingAdvisor.address || ''}
              onChange={e => setEditingAdvisor({ ...editingAdvisor, address: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none text-sm" rows={2} /></div>
            <div><Label>Verified</Label>
              <Select value={editingAdvisor.verified ? 'true' : 'false'} onChange={e => setEditingAdvisor({ ...editingAdvisor, verified: e.target.value === 'true' })}>
                <option value="true">✅ Verified — Active</option>
                <option value="false">❌ Unverified — Blocked</option>
              </Select>
            </div>
            <div><Label>Role</Label>
              <Select value={editingAdvisor.role || 'advisor'} onChange={e => setEditingAdvisor({ ...editingAdvisor, role: e.target.value })}>
                <option value="advisor">Advisor</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
          </div>
          <ModalButtons onCancel={() => setEditingAdvisor(null)} onConfirm={handleSaveAdvisor} confirmLabel="Save Changes" confirmClass="bg-blue-600 hover:bg-blue-500" />
        </Modal>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <Modal title={`✏️ Edit Lead: ${editingCustomer.name}`} onClose={() => setEditingCustomer(null)} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Name', key: 'name' }, { label: 'Phone', key: 'phoneNumber' }, { label: 'Email', key: 'email' },
              { label: 'Aadhar', key: 'aadhar' }, { label: 'Project Name', key: 'projectName' }, { label: 'Plot Number', key: 'plotNumber' },
              { label: 'Block', key: 'block' }, { label: 'Price/sqft (₹)', key: 'price', type: 'number' },
              { label: 'Base Amount (₹)', key: 'baseAmount', type: 'number' }, { label: 'Extra Charges (₹)', key: 'extraCharges', type: 'number' },
              { label: 'Final Amount (₹)', key: 'finalAmount', type: 'number' }, { label: 'Booking Amount Paid (₹)', key: 'bookingAmount', type: 'number' },
              { label: 'Tenure (months)', key: 'tenure', type: 'number' }, { label: 'EMI Amount (₹)', key: 'emi', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input type={f.type || 'text'} value={editingCustomer[f.key] || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, [f.key]: e.target.value })} />
              </div>
            ))}
            <div><Label>Address</Label><textarea value={editingCustomer.address || ''}
              onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none text-sm" rows={2} /></div>
            <div><Label>Status</Label>
              <Select value={editingCustomer.status || 'WAITING'} onChange={e => setEditingCustomer({ ...editingCustomer, status: e.target.value })}>
                <option value="WAITING">WAITING</option>
                <option value="BOOKED">BOOKED</option>
                <option value="PENDING_REGISTRATION">PENDING_REGISTRATION</option>
                <option value="REGISTERED">REGISTERED</option>
              </Select>
            </div>
            <div><Label>Payment Mode</Label>
              <Select value={editingCustomer.paymentMode || 'Full Payment'} onChange={e => setEditingCustomer({ ...editingCustomer, paymentMode: e.target.value })}>
                <option value="Full Payment">Full Payment</option><option value="EMI">EMI</option>
              </Select>
            </div>
            <div><Label>Reassign Advisor</Label>
              <Select value={typeof editingCustomer.advisor === 'object' ? editingCustomer.advisor?._id : editingCustomer.advisor || ''}
                onChange={e => setEditingCustomer({ ...editingCustomer, advisor: e.target.value })}>
                {advisors.map(a => <option key={a._id} value={a._id}>{a.name} ({a.email})</option>)}
              </Select>
            </div>
          </div>
          <ModalButtons onCancel={() => setEditingCustomer(null)} onConfirm={handleSaveCustomer} confirmLabel="Save Changes" confirmClass="bg-blue-600 hover:bg-blue-500" />
        </Modal>
      )}

      {/* Add Payment Modal */}
      {selectedPayCust && (
        <Modal title={`💵 Record Payment: ${selectedPayCust.name}`} onClose={() => { setSelectedPayCust(null); setPayAmount(''); setPayDate(''); setPayTime(''); setPayNote(''); }}>
            <div className="mb-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
               <Label>Current Balance</Label>
               <p className="text-sm font-medium text-gray-300">Paid: <span className="font-bold text-white">₹{(selectedPayCust.amountPaid || selectedPayCust.bookingAmount || 0).toLocaleString('en-IN')}</span> / {inr(selectedPayCust.finalAmount)}</p>
               <p className="text-xs text-orange-400 font-bold mt-1">Balance Due: {inr(Math.max(0, (selectedPayCust.finalAmount || 0) - (selectedPayCust.amountPaid || 0)))}</p>
            </div>

            <div className="mb-4">
               <Label>Amount Received (₹)</Label>
               <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" className="text-lg font-black" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
               <div>
                 <Label>Payment Date <span className="text-red-400">*</span></Label>
                 <Input type="date" value={payDate}
                   onChange={e => { setPayDate(e.target.value); setPayTime(''); }}
                   max={getNow().dStr}
                   className="text-sm" />
               </div>
               <div>
                 <Label>Payment Time</Label>
                 <Input type="time" value={payTime}
                   onChange={e => setPayTime(e.target.value)}
                   max={payDate === getNow().dStr ? getNow().tStr : undefined}
                   className="text-sm" />
                 <p className="text-xs text-gray-500 mt-1">
                   {payDate === getNow().dStr ? `Max: ${getNow().tStr} (now)` : 'Any time on selected date'}
                 </p>
               </div>
            </div>

            <div className="mb-6">
               <Label>Note / Remarks (optional)</Label>
               <Input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="e.g. Cash payment, Bank transfer ref #123..." className="text-sm" />
            </div>

            <ModalButtons onCancel={() => { setSelectedPayCust(null); setPayAmount(''); setPayDate(''); setPayTime(''); setPayNote(''); }} onConfirm={handlePaySubmit} confirmLabel="Record Payment" confirmClass="bg-emerald-600 hover:bg-emerald-500" />
        </Modal>
      )}

      {/* Commission Payout Modal */}
      {selectedBonusCust && (
        <Modal title={`💰 Record Commission Payout: ${selectedBonusCust.name}`} onClose={resetBonus}>
          <div className="mb-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
            <Label>Customer</Label>
            <p className="text-sm text-white font-bold">{selectedBonusCust.name} — {selectedBonusCust.projectName}, Plot {selectedBonusCust.plotNumber}</p>
            <p className="text-xs text-gray-400 mt-1">Payment Mode: {selectedBonusCust.paymentMode || '—'} | Status: {selectedBonusCust.status}</p>
          </div>

          <div className="mb-4">
            <Label>Pay To (Advisor) <span className="text-red-400">*</span></Label>
            <Select value={bonusAdvisorId} onChange={e => setBonusAdvisorId(e.target.value)}>
              <option value="">— Select Advisor —</option>
              {(selectedBonusCust.commissionDistribution || []).map((dist, i) => {
                const adv = dist.advisor;
                if (!adv) return null;
                return (
                  <option key={i} value={adv._id || adv}>
                    {adv.name || 'Unknown'} ({adv.advisorId || adv.email || '—'}) {dist.isDirectSale ? '— Direct Seller' : '— Upline'}
                  </option>
                );
              })}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Payout Amount (₹) <span className="text-red-400">*</span></Label>
              <Input type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Payout Date <span className="text-red-400">*</span></Label>
              <Input type="date" value={bonusDate} onChange={e => setBonusDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="mb-6">
            <Label>Note / Reference (optional)</Label>
            <Input type="text" value={bonusNote} onChange={e => setBonusNote(e.target.value)} placeholder="e.g. Bank transfer ref #123, cash payment..." />
          </div>

          <ModalButtons onCancel={resetBonus} onConfirm={handleBonusSubmit} confirmLabel="Record Payout" confirmClass="bg-yellow-600 hover:bg-yellow-500" />
        </Modal>
      )}

      {/* Advisor Profile View Modal */}
      {viewAdvisorProfile && (
        <Modal title={`🧑‍💼 Advisor Profile: ${viewAdvisorProfile.name}`} onClose={() => setViewAdvisorProfile(null)}>
          <div className="space-y-4 text-sm">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <h4 className="font-bold text-gray-400 mb-2 uppercase text-xs">Primary Info</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">Name:</span> <span className="text-white">{viewAdvisorProfile.name}</span></div>
                <div><span className="text-gray-500">ID:</span> <span className="text-yellow-400">{viewAdvisorProfile.advisorId || '—'}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="text-white">{viewAdvisorProfile.email}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="text-white">{viewAdvisorProfile.phoneNumber}</span></div>
                <div><span className="text-gray-500">Status:</span> {viewAdvisorProfile.verified ? <span className="text-green-400">Verified</span> : <span className="text-red-400">Pending</span>}</div>
                <div><span className="text-gray-500">Joined:</span> <span className="text-white">{fmt(viewAdvisorProfile.date)}</span></div>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <h4 className="font-bold text-gray-400 mb-2 uppercase text-xs">KYC & Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">PAN:</span> <span className="text-white font-mono">{viewAdvisorProfile.pan || 'Not Provided'}</span></div>
                <div><span className="text-gray-500">Aadhar:</span> <span className="text-white font-mono">{viewAdvisorProfile.aadhar || 'Not Provided'}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="text-white">{viewAdvisorProfile.address || '—'}</span></div>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <h4 className="font-bold text-gray-400 mb-2 uppercase text-xs">Business & Hierarchy</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">Badge/Slab:</span> <span className="text-amber-400">{viewAdvisorProfile.badge || 'Bronze'} (Slab {viewAdvisorProfile.currentSlab || 0})</span></div>
                <div><span className="text-gray-500">Hierarchy:</span> <span className="text-purple-400">{viewAdvisorProfile.parentAdvisor?.name || 'Company Root'}</span></div>
                <div><span className="text-gray-500">Total Business:</span> <span className="text-emerald-400 font-bold">{inr(viewAdvisorProfile.totalBusiness)}</span></div>
                <div><span className="text-gray-500">Self Business:</span> <span className="text-blue-400 font-bold">{inr(viewAdvisorProfile.selfBusiness)}</span></div>
                <div><span className="text-gray-500">Team Size:</span> <span className="text-white">{viewAdvisorProfile.connectedAdvisors?.length || 0}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-6">
              <button onClick={() => { setEditingAdvisor({ ...viewAdvisorProfile }); setViewAdvisorProfile(null); }} className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded text-xs uppercase">✏ Edit Profile</button>
              <button onClick={() => { handleDeleteAdvisor(viewAdvisorProfile._id, viewAdvisorProfile.name); setViewAdvisorProfile(null); }} className="bg-red-900 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs uppercase">🗑 Delete Advisor</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---- Shared Sub-components ----
function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-8`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-black leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Label({ children, className = '' }) {
  return <label className={`block text-xs font-bold uppercase text-gray-400 mb-1 ${className}`}>{children}</label>;
}

function Input({ className = '', ...props }) {
  return <input {...props} className={`w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-blue-500 text-sm ${className}`} />;
}

function Select({ children, className = '', ...props }) {
  return <select {...props} className={`w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none text-sm ${className}`}>{children}</select>;
}

function ModalButtons({ onCancel, onConfirm, confirmLabel, confirmClass }) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-700 pt-4 mt-2">
      <button onClick={onCancel} className="px-5 py-2 text-gray-400 hover:text-white font-bold text-xs uppercase">Cancel</button>
      <button onClick={onConfirm} className={`px-6 py-2 text-white font-bold rounded text-xs uppercase ${confirmClass}`}>{confirmLabel}</button>
    </div>
  );
}
