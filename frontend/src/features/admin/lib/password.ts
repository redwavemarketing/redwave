/**
 * generateTempPassword — a strong, copy-able initial credential for a newly-created user. The backend
 * REQUIRES a password on create (8–128) and has NO invite/reset/must-change flow (AUTH-002 is a flagged
 * follow-up), so the admin sets an initial password here; the user changes it under My Account → Security.
 * Uses Web Crypto (not Math.random) and guarantees one of each character class. Display-only; shown once.
 */
const LOWERS = 'abcdefghijkmnpqrstuvwxyz'; // no l
const UPPERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O
const DIGITS = '23456789'; // no 0/1
const SYMBOLS = '!@#$%^&*?-_';
const ALL = LOWERS + UPPERS + DIGITS + SYMBOLS;

function randomInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}
const pick = (set: string): string => set[randomInt(set.length)];

export function generateTempPassword(length = 16): string {
  const required = [pick(LOWERS), pick(UPPERS), pick(DIGITS), pick(SYMBOLS)];
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pick(ALL));
  const chars = [...required, ...rest];
  // Fisher–Yates shuffle so the required classes aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
