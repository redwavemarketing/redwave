import { PasswordResetService } from './password-reset.service';
import { DomainError } from '../../common/errors/domain-error';

function make() {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    passwordResetToken: {
      create: jest.fn().mockResolvedValue({ id: 't1' }),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const mailer = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const service = new PasswordResetService(prisma as never, mailer as never, audit as never, config as never);
  return { service, prisma, mailer };
}

describe('PasswordResetService.forgot (non-enumerating)', () => {
  it('emails a reset link for an active user', async () => {
    const { service, prisma, mailer } = make();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'active', full_name: 'Jane', email: 'j@x.co' });
    await service.forgot('j@x.co');
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(mailer.sendPasswordReset).toHaveBeenCalledWith('j@x.co', 'Jane', expect.any(String));
  });

  it('does NOTHING for an unknown email (no enumeration, still resolves)', async () => {
    const { service, prisma, mailer } = make();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.forgot('nobody@x.co')).resolves.toBeUndefined();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('does nothing for an inactive user', async () => {
    const { service, prisma, mailer } = make();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'inactive', full_name: 'J', email: 'j@x.co' });
    await service.forgot('j@x.co');
    expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
  });
});

describe('PasswordResetService.reset', () => {
  it('sets the password + consumes the token for a valid token', async () => {
    const { service, prisma } = make();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 't1',
      user_id: 'u1',
      used_at: null,
      expires_at: new Date(Date.now() + 60_000),
    });
    await service.reset('rawtoken', 'Redwave1');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: expect.objectContaining({ must_change_password: false, locked_until: null }) }),
    );
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't1' }, data: expect.objectContaining({ used_at: expect.any(Date) }) }),
    );
  });

  it('rejects a weak password (422 before touching the token)', async () => {
    const { service } = make();
    await expect(service.reset('rawtoken', 'weak')).rejects.toBeInstanceOf(DomainError);
  });

  it('rejects an expired token (422)', async () => {
    const { service, prisma } = make();
    prisma.passwordResetToken.findUnique.mockResolvedValue({ id: 't1', user_id: 'u1', used_at: null, expires_at: new Date(Date.now() - 1000) });
    await expect(service.reset('rawtoken', 'Redwave1')).rejects.toBeInstanceOf(DomainError);
  });

  it('rejects an already-used token (422)', async () => {
    const { service, prisma } = make();
    prisma.passwordResetToken.findUnique.mockResolvedValue({ id: 't1', user_id: 'u1', used_at: new Date(), expires_at: new Date(Date.now() + 60_000) });
    await expect(service.reset('rawtoken', 'Redwave1')).rejects.toBeInstanceOf(DomainError);
  });

  it('rejects an unknown token (422)', async () => {
    const { service, prisma } = make();
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(service.reset('rawtoken', 'Redwave1')).rejects.toBeInstanceOf(DomainError);
  });
});
