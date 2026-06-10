import { ApiProperty } from '@nestjs/swagger';

export class SessionResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true, description: 'The browser/device user-agent string.' })
  user_agent!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'IP address last seen for this session.' })
  ip_address!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  last_used_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expires_at!: string;

  @ApiProperty({ description: 'True for the session the caller is currently using.' })
  is_current!: boolean;
}
