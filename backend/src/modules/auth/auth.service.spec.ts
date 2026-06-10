import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService.login (AUTH-001 / AUTH-002 / AUTH-008)', () => {
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };
  let tokens: { signAccess: jest.Mock; signRefresh: jest.Mock; verifyRefresh: jest.Mock };
  let audit: { log: jest.Mock };
  let config: { get: jest.Mock };
  let service: AuthService;
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash('correct-horse', 4); // low rounds → fast tests
  });

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) } };
    tokens = {
      signAccess: jest.fn().mockResolvedValue('access-token'),
      signRefresh: jest.fn().mockResolvedValue('refresh-token'),
      verifyRefresh: jest.fn(),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    config = { get: jest.fn().mockReturnValue(undefined) }; // use defaults (5 attempts / 15 min)
    service = new AuthService(prisma as never, tokens as never, audit as never, config as never);
  });

  const activeUser = (over: Record<string, unknown> = {}) => ({
    id: 'u1',
    status: 'active',
    password_hash: hash,
    failed_login_attempts: 0,
    locked_until: null,
    must_change_password: false,
    ...over,
  });

  it('issues tokens + must_change_password for correct credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser());
    await expect(service.login('a@b.co', 'correct-horse')).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      must_change_password: false,
    });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'login' }));
  });

  it('surfaces must_change_password=true (post-invite / admin reset)', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser({ must_change_password: true }));
    await expect(service.login('a@b.co', 'correct-horse')).resolves.toMatchObject({ must_change_password: true });
  });

  it('rejects a wrong password and increments the failed-attempt counter', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser({ failed_login_attempts: 1 }));
    await expect(service.login('a@b.co', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { failed_login_attempts: 2 } }));
  });

  it('LOCKS the account on the 5th failed attempt', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser({ failed_login_attempts: 4 }));
    await expect(service.login('a@b.co', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    const data = prisma.user.update.mock.calls[0][0].data as { locked_until: Date; failed_login_attempts: number };
    expect(data.locked_until).toBeInstanceOf(Date);
    expect(data.failed_login_attempts).toBe(0); // reset for a fresh window after the lock
  });

  it('refuses login while the account is locked (even with the right password)', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser({ locked_until: new Date(Date.now() + 600_000) }));
    await expect(service.login('a@b.co', 'correct-horse')).rejects.toThrow(/locked/i);
  });

  it('clears the counter + lock on a successful login', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser({ failed_login_attempts: 2 }));
    await service.login('a@b.co', 'correct-horse');
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { failed_login_attempts: 0, locked_until: null } }));
  });

  it('rejects an unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nobody@b.co', 'correct-horse')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an inactive account even with the right password (AUTH-008)', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser({ status: 'inactive' }));
    await expect(service.login('a@b.co', 'correct-horse')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
