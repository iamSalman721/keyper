/**
 * HatchGate - ephemeral, same-tab/session gate for the hidden reset route.
 * Uses sessionStorage with a short TTL to "arm" the hatch without redeploys.
 *
 * Security note: This is obscurity, not authentication. Keep arming
 * instructions private and time-bound.
 */

const KEY = 'keyper-reset-armed';

function now(): number {
  return Date.now();
}

/** Arm the hatch for a limited window (default: 2 minutes). */
export function arm(ttlMs: number = 2 * 60 * 1000): void {
  const until = now() + Math.max(0, ttlMs | 0);
  try {
    sessionStorage.setItem(KEY, String(until));
  } catch {
    /* fail closed */
  }
}

/** True while the TTL is valid for this tab/session. */
export function isArmed(): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && now() < until;
  } catch {
    return false;
  }
}

/** Remove the arming flag. */
export function disarm(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Optional soft check: require presence of a local admin marker.
 * (Still client-side; reduces accidental discovery only.)
 */
export function canShowReset(requireAdminMarker = false): boolean {
  if (!isArmed()) return false;
  if (!requireAdminMarker) return true;
  try {
    const admin = localStorage.getItem('keyper-admin-user');
    return !!admin && admin.trim().length > 0;
  } catch {
    return false;
  }
}

export const HatchGate = { arm, isArmed, disarm, canShowReset } as const;
