/**
 * PrismaModule — makes PrismaService available app-wide.
 *
 * Marked @Global so domain modules can inject PrismaService without re-importing
 * this module everywhere.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
