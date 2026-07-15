// Client-side rate limiter for auth actions (login, signup, reset)
// This is a UX safeguard; real rate limiting is enforced by Supabase server-side.

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const limits: Record<string, RateLimitEntry> = {};

const WINDOW_MS = 60_000; // 1 minute window
const MAX_ATTEMPTS: Record<string, number> = {
  signIn: 5,
  signUp: 3,
  resetPassword: 3,
};
const LOCKOUT_MS = 60_000; // 1 minute lockout after exceeding

export function checkAuthRateLimit(action: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const maxAttempts = MAX_ATTEMPTS[action] ?? 5;

  if (!limits[action]) {
    limits[action] = { count: 0, firstAttempt: now, lockedUntil: null };
  }

  const entry = limits[action];

  // Check lockout
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  // Reset window if expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAttempt = now;
    entry.lockedUntil = null;
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    entry.lockedUntil = now + LOCKOUT_MS;
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  return { allowed: true };
}

export function resetAuthRateLimit(action: string) {
  delete limits[action];
}
