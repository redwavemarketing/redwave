import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'A valid refresh token previously issued by /auth/login.' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
