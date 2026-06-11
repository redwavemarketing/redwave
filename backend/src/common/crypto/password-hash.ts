/**
 * Canonical password hashing — bcryptjs at cost 12, identical to how the auth/users/account services store
 * passwords. The single source of truth for the cost factor so a hash made here verifies via `bcrypt.compare`
 * exactly like an app-set password. Reuse this anywhere a password is hashed. — CLAUDE §3 (passwords)
 */
import * as bcrypt from 'bcryptjs';

export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
