/**
 * Auth response DTOs — login/refresh token pairs + the `/me` profile bundle. — Batch A #2
 * (logout returns the shared `SuccessResponse`.)
 */
import { ApiProperty } from '@nestjs/swagger';
import { ThemePreference, UserStatus } from '@prisma/client';

export class LoginResponse {
  @ApiProperty({ type: String, nullable: true, required: false, description: 'Short-lived access JWT (Bearer). Absent when mfa_required is true.' })
  access_token?: string | null;

  @ApiProperty({ type: String, nullable: true, required: false, description: 'The CSRF token (also set as the readable rw_csrf cookie). Echo it in the X-CSRF-Token header.' })
  csrf_token?: string | null;

  @ApiProperty({ type: Boolean, nullable: true, required: false, description: 'When true, the user must change their password before continuing.' })
  must_change_password?: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true, required: false, description: 'When true, policy requires this user to enrol in MFA before continuing.' })
  mfa_enrollment_required?: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true, required: false, description: 'When true, the user has MFA enabled — redeem mfa_token at /auth/mfa/verify.' })
  mfa_required?: boolean | null;

  @ApiProperty({ type: String, nullable: true, required: false, description: 'Short-lived MFA challenge token (when mfa_required).' })
  mfa_token?: string | null;
}

export class RefreshResponse {
  @ApiProperty()
  access_token!: string;
}

/** The public user profile (no password hash) embedded in `/me`. */
export class MeUserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  full_name!: string;

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatar_url!: string | null;

  @ApiProperty({ enum: ThemePreference })
  theme_preference!: ThemePreference;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ description: 'When true, the user must change their password before continuing.' })
  must_change_password!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: string;
}

export class MeResponse {
  @ApiProperty({ type: () => MeUserResponse })
  user!: MeUserResponse;

  @ApiProperty({ type: [String], description: 'Role names held by the user.' })
  roles!: string[];

  @ApiProperty()
  is_super_admin!: boolean;

  @ApiProperty({ type: String, nullable: true, description: 'Linked rep id, if the user is also a rep.' })
  rep_id!: string | null;

  @ApiProperty({ type: [String], description: 'Union of the user roles’ permission keys (moduleKey:action).' })
  effective_permissions!: string[];
}
