import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { RefreshSessionService } from './refresh-session.service';

const sha256 = (v: string): string => createHash('sha256').update(v).digest('hex');

function make() {
  const rows = new Map<string, { id: string; user_id: string; token_hash: string; revoked_at: Date | null; expires_at: Date }>();
  let seq = 0;
  const prisma = {
    refreshSession: {
      create: jest.fn(async ({ data }: { data: { user_id: string; token_hash: string; expires_at: Date } }) => {
        const id = `sid-${(seq += 1)}`;
        rows.set(id, { id, user_id: data.user_id, token_hash: data.token_hash, revoked_at: null, expires_at: data.expires_at });
        return { id };
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = rows.get(id)!;
        Object.assign(row, data);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: { where: { id?: string; revoked_at?: null }; data: { revoked_at: Date } }) => {
        let count = 0;
        for (const row of rows.values()) {
          if (where.id && row.id !== where.id) continue;
          if (where.revoked_at === null && row.revoked_at) continue;
          row.revoked_at = data.revoked_at;
          count += 1;
        }
        return { count };
      }),
    },
  };
  const config = { get: jest.fn((_k: string, d?: string) => d) };
  return { service: new RefreshSessionService(prisma as never, config as never), rows };
}

describe('RefreshSessionService — rotation + reuse detection (arch §security)', () => {
  it('issues `<sid>.<secret>` and stores only the secret hash', async () => {
    const { service, rows } = make();
    const { token, sid } = await service.issue('u1');
    const [tokenSid, secret] = token.split('.');
    expect(tokenSid).toBe(sid);
    expect(rows.get(sid)!.token_hash).toBe(sha256(secret));
    expect(rows.get(sid)!.token_hash).not.toBe(secret); // plaintext is never stored
  });

  it('rotates: a valid token yields a NEW token and invalidates the old one', async () => {
    const { service } = make();
    const first = await service.issue('u1');
    const rotated = await service.rotate(first.token);
    expect(rotated.token).not.toBe(first.token);
    expect(rotated.sid).toBe(first.sid);
    // The original (now-rotated) token must no longer rotate — it's a reuse → revoke.
    await expect(service.rotate(first.token)).rejects.toBeInstanceOf(UnauthorizedException);
    // …and the session is now revoked, so even the latest token fails.
    await expect(service.rotate(rotated.token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('REUSE of an old secret revokes the session (breach detection)', async () => {
    const { service, rows } = make();
    const first = await service.issue('u1');
    await service.rotate(first.token); // rotate once
    await service.rotate(first.token).catch(() => undefined); // replay the old token
    expect(rows.get(first.sid)!.revoked_at).toBeInstanceOf(Date);
  });

  it('isActive is false once revoked; revoke is idempotent', async () => {
    const { service } = make();
    const s = await service.issue('u1');
    expect(await service.isActive(s.sid)).toBe(true);
    await service.revoke(s.sid, 'u1');
    expect(await service.isActive(s.sid)).toBe(false);
  });

  it('revoke enforces ownership', async () => {
    const { service } = make();
    const s = await service.issue('u1');
    await expect(service.revoke(s.sid, 'someone-else')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a malformed or expired token', async () => {
    const { service, rows } = make();
    await expect(service.rotate(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.rotate('no-dot')).rejects.toBeInstanceOf(UnauthorizedException);
    const s = await service.issue('u1');
    rows.get(s.sid)!.expires_at = new Date(Date.now() - 1000); // expire it
    await expect(service.rotate(s.token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
