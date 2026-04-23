/** Default hosted API (no trailing slash). Override with VITE_API_BASE in .env.local — e.g. http://localhost:5000/api for local Express. */
const DEFAULT_API_BASE = 'http://localhost:5000/api';

function normalizeBase(base) {
  return base.replace(/\/$/, '');
}

export function getApiBase() {
  const env = import.meta.env.VITE_API_BASE;
  if (env) return normalizeBase(env);

  // Warning for production deployments using localhost default
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.warn('[API] Warning: No VITE_API_BASE environment variable found. Falling back to localhost:5000, which will likely fail on non-local browsers.');
  }
  
  return DEFAULT_API_BASE;
}

export const apiBase = getApiBase();
export const apiAdvisors = `${apiBase}/advisors`;
export const apiDev = `${apiBase}/dev`;
export const apiAuth = `${apiBase}/auth`;
export const apiPlots = `${apiBase}/plots`;
