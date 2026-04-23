import React, { useState } from 'react';
import { apiAuth } from '../../config/api.js';

export default function DevLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiAuth}/dev/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed.'); return; }
      sessionStorage.setItem('devToken', data.token);
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-700/60 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Header strip */}
          <div className="bg-gradient-to-r from-red-900/60 to-gray-900 border-b border-red-900/40 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-xl">⚡</div>
              <div>
                <h1 className="text-white font-black text-lg tracking-widest uppercase">System Override Portal</h1>
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Superadmin Access Only</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Restricted Zone — Unauthorized access is logged</span>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <input
                  id="dev-username"
                  type="text"
                  autoComplete="off"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Enter dev username"
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm font-mono placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    id="dev-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter dev password"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-12 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm font-mono placeholder-gray-600"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-base">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-950/60 border border-red-700/50 rounded-xl px-4 py-3 text-red-400 text-xs font-bold">
                  <span>⛔</span> {error}
                </div>
              )}

              <button
                id="dev-login-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl tracking-widest uppercase text-sm transition-all hover:shadow-lg hover:shadow-red-900/40 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : '⚡ Enter Override Console'}
              </button>
            </form>

            <p className="text-center text-gray-700 text-xs mt-6 font-mono">Session expires when tab is closed</p>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">Mount City Developers — Internal Admin System</p>
      </div>
    </div>
  );
}
