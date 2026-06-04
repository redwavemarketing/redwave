import { Module } from '@nestjs/common';
import { RbacCatalogueController, RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController, RbacCatalogueController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
