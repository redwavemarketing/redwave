/**
 * Reusable Prisma selection for returning a user WITHOUT secret fields.
 * password_hash is never selected, so it can never be logged or returned. — CLAUDE §3 (passwords)
 */
import { Prisma } from '@prisma/client';

export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  avatar_url: true,
  theme_preference: true,
  status: true,
  must_change_password: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_SELECT }>;
