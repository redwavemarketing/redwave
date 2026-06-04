import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@redwave.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'DevSuperAdmin!123', writeOnly: true })
  @IsString()
  @MinLength(1)
  password!: string;
}
