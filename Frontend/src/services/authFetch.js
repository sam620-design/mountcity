/**
 * authFetch.js — Centralized authenticated fetch helpers
 *
 * NEVER make raw fetch() calls to protected API routes.
 * Use one of the helpers below which automatically attach the correct
 * Authorization header from sessionStorage.
 *
 * Portal token keys:
 *  - Advisor Portal  → sessionStorage 'token'
 *  - Dev Portal      → sessionStorage 'devToken'
 *  - Owner Portal    → sessionStorage 'ownerToken'
 */

/**
 * Fetch with the Advisor JWT attached.
 * Use for routes protected by the `protect` middleware.
 */
export function advisorFetch(url, options = {}) {
  const token = sessionStorage.getItem('token') || '';
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

/**
 * Fetch with the Dev Portal JWT attached.
 * Use for routes protected by the `protectDev` middleware.
 */
export function devFetch(url, options = {}) {
  const token = sessionStorage.getItem('devToken') || '';
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

/**
 * Fetch with the Owner Portal JWT attached.
 * Use for routes protected by the `protectOwner` or `protectDevOrOwner` middleware.
 */
export function ownerFetch(url, options = {}) {
  const token = sessionStorage.getItem('ownerToken') || '';
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

/**
 * Generic helper: try devToken first, fall back to ownerToken.
 * Use for `protectDevOrOwner` routes (e.g. GET /dev/data).
 */
export function devOrOwnerFetch(url, options = {}) {
  const token = sessionStorage.getItem('devToken') || sessionStorage.getItem('ownerToken') || '';
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}
