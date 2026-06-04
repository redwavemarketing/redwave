import { Module } from '@nestjs/common';
import { AccountController, ProfileChangeReviewController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  controllers: [AccountController, ProfileChangeReviewController],
  providers: [AccountService],
})
export class AccountModule {}
