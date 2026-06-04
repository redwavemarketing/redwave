/**
 * Billing read + export controllers — /v1/statements and /v1/invoices. — arch §6.9
 * Listing/detail require billing:view; exporting a file requires billing:export. Billing is
 * per-CLIENT partner data, gated by the billing:* permissions (no rep scoping applies).
 */
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StatementService } from './statement.service';
import { InvoiceService } from './invoice.service';
import { BillingExportService } from './billing-export.service';
import { ListBillingQuery } from './dto/list.query';
import { BillingExportDto } from './dto/export.dto';

@ApiTags('Billing & Statements')
@ApiBearerAuth()
@Controller('statements')
export class StatementsController {
  constructor(
    private readonly statements: StatementService,
    private readonly exports: BillingExportService,
  ) {}

  @Get()
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'List generated statements', description: 'Requires billing:view.' })
  list(@Query() query: ListBillingQuery) {
    return this.statements.list(query);
  }

  @Get(':id')
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'Get a statement with its lines', description: 'Requires billing:view.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.statements.findOne(id);
  }

  @Post(':id/export')
  @RequirePermission('billing', 'export')
  @ApiOperation({
    summary: 'Export a statement (stub file)',
    description: 'Requires billing:export. Updates the file_url reference; real render deferred.',
  })
  export(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BillingExportDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.exports.exportStatement(id, dto.format, actorId);
  }
}

@ApiTags('Billing & Statements')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoiceService,
    private readonly exports: BillingExportService,
  ) {}

  @Get()
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'List generated invoices', description: 'Requires billing:view.' })
  list(@Query() query: ListBillingQuery) {
    return this.invoices.list(query);
  }

  @Get(':id')
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'Get an invoice', description: 'Requires billing:view.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.findOne(id);
  }

  @Post(':id/export')
  @RequirePermission('billing', 'export')
  @ApiOperation({
    summary: 'Export an invoice (stub file)',
    description: 'Requires billing:export. Updates the file_url reference; real render deferred.',
  })
  export(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BillingExportDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.exports.exportInvoice(id, dto.format, actorId);
  }
}
