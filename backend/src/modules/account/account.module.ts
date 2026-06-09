import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { AccountController, ProfileChangeReviewController } from './account.controller';
import { AccountService } from './account.service';
import { UserSignaturesController } from './user-signatures.controller';
import { UserSignaturesService } from './user-signatures.service';

@Module({
  imports: [StorageModule],
  controllers: [AccountController, ProfileChangeReviewController, UserSignaturesController],
  providers: [AccountService, UserSignaturesService],
})
export class AccountModule {}
