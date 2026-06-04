import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService.login (AUTH-001 / AUTH-008)', () => {
  let prisma: { user: { findUnique: jest.Mock } };
  let tokens: { signAccess: jest.Mock; signRefresh: jest.Mock; verifyRefresh: jest.Mock };
  let audit: { log: jest.Mock };
  let service: AuthService;
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash('correct-horse', 4); // low rounds → fast tests
  });

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    tokens = {
      signAccess: jest.fn().mockResolvedValue('access-token'),
      signRefresh: jest.fn().mockResolvedValue('refresh-token'),
      verifyRefresh: jest.fn(),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new AuthService(prisma as never, tokens as never, audit as never);
  });

  it('issues tokens for correct credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'active', password_hash: hash });
    await expect(service.login('a@b.co', 'correct-horse')).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'login' }));
  });

  it('rejects a wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'active', password_hash: hash });
    await expect(service.login('a@b.co', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nobody@b.co', 'correct-horse')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an inactive account even with the right password (AUTH-008)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'inactive', password_hash: hash });
    await expect(service.login('a@b.co', 'correct-horse')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
