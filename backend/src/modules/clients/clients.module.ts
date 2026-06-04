import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ProductsController } from './products.controller';
import { ClientsService } from './clients.service';
import { ProductsService } from './products.service';
import { BillingRatesService } from './billing-rates.service';

@Module({
  controllers: [ClientsController, ProductsController],
  providers: [ClientsService, ProductsService, BillingRatesService],
  exports: [ClientsService, ProductsService, BillingRatesService],
})
export class ClientsModule {}
