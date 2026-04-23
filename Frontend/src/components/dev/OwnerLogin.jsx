import React, { useState } from 'react';
import { apiAuth } from '../../config/api.js';

export default function OwnerLogin({ onSuccess }) {
  const [step, setStep] = useState(1); // 1 = password, 2 = secret word
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiAuth}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed.'); return; }
      setTempToken(data.tempToken);
      setOwnerName(data.username);
      setStep(2);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecretSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiAuth}/owner/verify-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, secretWord }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Incorrect secret word.'); return; }
      sessionStorage.setItem('ownerToken', data.token);
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${
                step === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110' :
                step > s ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 2 && (
                <div className={`h-0.5 w-12 transition-all duration-500 ${step > 1 ? 'bg-emerald-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border-b border-white/10 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-lg">🏢</div>
              <div>
                <h1 className="text-white font-black text-xl tracking-tight">Mount City Developers</h1>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Owner Dashboard</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
            </div>
            <p className="text-white/40 text-[10px] font-bold mt-1.5 uppercase tracking-widest">
              Step {step} of 2 — {step === 1 ? 'Identity Verification' : 'Access Key Confirmation'}
            </p>
          </div>

          {/* Forms */}
          <div className="px-8 py-8">

            {/* ── Step 1: Password ── */}
            {step === 1 && (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <p className="text-white/60 text-sm">Enter your owner credentials to proceed</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Username</label>
                  <input
                    id="owner-username"
                    type="text"
                    autoComplete="off"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="Enter owner username"
                    required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm placeholder-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <input
                      id="owner-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter owner password"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm placeholder-white/20"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-base">
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-bold">
                    <span>⛔</span> {error}
                  </div>
                )}
                <button id="owner-pw-btn" type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl tracking-wider uppercase text-sm transition-all hover:shadow-lg hover:shadow-indigo-900/50 active:scale-95">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : '→ Continue to Step 2'}
                </button>
              </form>
            )}

            {/* ── Step 2: Secret Word ── */}
            {step === 2 && (
              <form onSubmit={handleSecretSubmit} className="space-y-5">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🔑</div>
                  <p className="text-white font-black text-base">Almost there, {ownerName}!</p>
                  <p className="text-white/40 text-sm mt-1">Enter your secret access word to unlock the panel</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Secret Access Word</label>
                  <div className="relative">
                    <input
                      id="owner-secret"
                      type={showSecret ? 'text' : 'password'}
                      autoComplete="off"
                      value={secretWord}
                      onChange={e => { setSecretWord(e.target.value); setError(''); }}
                      placeholder="Enter your secret word"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm placeholder-white/20 tracking-widest"
                    />
                    <button type="button" onClick={() => setShowSecret(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-base">
                      {showSecret ? '🙈' : '👁'}
                    </button>
                  </div>
                  <p className="text-white/20 text-[10px] mt-1.5 font-bold uppercase tracking-widest">This is a separate word, not your password</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-bold">
                    <span>⛔</span> {error}
                  </div>
                )}

                <button id="owner-secret-btn" type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl tracking-wider uppercase text-sm transition-all hover:shadow-lg hover:shadow-purple-900/50 active:scale-95">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Unlocking...
                    </span>
                  ) : '🔓 Unlock Owner Panel'}
                </button>

                <button type="button" onClick={() => { setStep(1); setError(''); setSecretWord(''); }}
                  className="w-full text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-wider transition-colors py-2">
                  ← Back to Step 1
                </button>
              </form>
            )}

            <p className="text-center text-white/20 text-xs mt-6 font-mono">Session expires when browser tab is closed</p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-4">Mount City Developers Pvt. Ltd. — Owner Portal v2.0</p>
      </div>
    </div>
  );
}
