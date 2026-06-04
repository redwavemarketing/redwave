/**
 * PayPeriodService — lists the pre-loaded pay periods (the seed loads the 2026 schedule). Sales
 * derives a sale's period from sale_date; Pay Run owns the periods themselves. — SRS PAY-001
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayPeriodService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.payPeriod.findMany({ orderBy: { period_number: 'asc' } });
  }
}
