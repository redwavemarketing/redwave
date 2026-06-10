import { ApiProperty } from '@nestjs/swagger';

export class RoleMfaResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  mfa_required!: boolean;
}

export class SecuritySettingsResponse {
  @ApiProperty({ description: 'Master MFA-enforcement switch.' })
  mfa_enforced!: boolean;

  @ApiProperty({ type: () => [RoleMfaResponse], description: 'Every role with its MFA-required flag.' })
  roles!: RoleMfaResponse[];
}
