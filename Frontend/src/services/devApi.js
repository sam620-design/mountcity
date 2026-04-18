import { apiDev, apiAuth } from '../config/api.js';

/** Helper: get dev token from sessionStorage */
function getDevToken() {
  return sessionStorage.getItem('devToken') || '';
}

/** Helper: get owner token from sessionStorage */
function getOwnerToken() {
  return sessionStorage.getItem('ownerToken') || '';
}

/** Authenticated fetch for dev portal — attaches devToken */
function devFetch(url, options = {}) {
  const token = getDevToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
}

/** GET /api/dev/data — used by Dev Portal & My Panel */
export async function fetchDevData() {
  const url = `${apiDev}/data`;
  try {
    // MyPanel uses ownerToken, DevPortal uses devToken
    const token = getDevToken() || getOwnerToken();
    const r = await fetch(url, {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    const text = await r.text();
    let d;
    try {
      d = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `Unexpected response (HTTP ${r.status}). The API may be down or not JSON.`,
        data: null,
      };
    }
    if (!r.ok) {
      return {
        ok: false,
        error: d.message || `Request failed (HTTP ${r.status})`,
        data: null,
      };
    }
    return {
      ok: true,
      error: null,
      data: {
        advisors: d.advisors || [],
        customers: d.customers || [],
        applications: d.applications || [],
        stats: d.stats || {},
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e.message || 'Network error.',
      data: null,
    };
  }
}

/** POST /api/dev/authorize-registration */
export async function authorizeRegistration(customerId, action) {
  const url = `${apiDev}/authorize-registration`;
  try {
    const r = await devFetch(url, {
      method: 'POST',
      body: JSON.stringify({ customerId, action })
    });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d.message || 'Request failed' };
    return { ok: true, data: d };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** POST /api/dev/reset-advisor-totals */
export async function resetAdvisorTotals(advisorId = null) {
  const url = `${apiDev}/reset-advisor-totals`;
  try {
    const body = advisorId ? JSON.stringify({ advisorId }) : undefined;
    const r = await devFetch(url, { method: 'POST', body });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d.message || 'Request failed' };
    return { ok: true, data: d };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** GET /api/auth/credentials */
export async function getPortalCredentials() {
  try {
    const token = getDevToken();
    const r = await fetch(`${apiAuth}/credentials`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d.message };
    return { ok: true, data: d };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** PUT /api/auth/credentials */
export async function updatePortalCredential(field, newValue) {
  try {
    const token = getDevToken();
    const r = await fetch(`${apiAuth}/credentials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ field, newValue })
    });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d.message };
    return { ok: true, data: d };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
