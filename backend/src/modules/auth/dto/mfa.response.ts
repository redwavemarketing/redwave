import { ApiProperty } from '@nestjs/swagger';

export class MfaStatusResponse {
  @ApiProperty({ description: 'Whether TOTP MFA is currently enabled for the caller.' })
  enabled!: boolean;
}

export class MfaSetupResponse {
  @ApiProperty({ description: 'otpauth:// provisioning URI for manual entry.' })
  otpauth_url!: string;

  @ApiProperty({ description: 'A data-URL PNG QR code encoding the otpauth URI.' })
  qr_data_url!: string;

  @ApiProperty({ description: 'The base32 secret (for manual entry if the QR cannot be scanned).' })
  secret!: string;
}

export class MfaRecoveryCodesResponse {
  @ApiProperty({ type: [String], description: 'One-time recovery codes — shown ONCE. Store them safely.' })
  recovery_codes!: string[];
}
