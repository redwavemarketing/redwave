/**
 * Expense report FOLDER controller — /v1/expense-reports (report-as-folder, EXP-001). — arch §6.8
 *
 * Folder create/manage floors at expenses:create (a rep manages their OWN folder) with service-level
 * ownership/scope authorization (§5 — the service is the real gate); folder review requires expenses:approve.
 * The folder has no stored status — its status/total/validation are derived on read.
 */
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { ExpenseReportsService } from './expense-report.service';
import { CreateExpenseReportDto, ListExpenseReportsQuery, ReviewReportDto, UpdateExpenseReportDto } from './dto/expense-report.dto';
import { ExpenseReportPageResponse, ExpenseReportResponse } from './dto/expense-report.response';

@ApiTags('Expenses')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('expense-reports')
export class ExpenseReportsController {
  constructor(private readonly reports: ExpenseReportsService) {}

  @Post()
  @RequirePermission('expenses', 'create')
  @ApiOperation({ summary: 'Create an expense report folder', description: 'Requires expenses:create. Names a folder (default week = the business week Mon–Sun) to add items into.' })
  @ApiCreatedResponse({ type: ExpenseReportResponse })
  create(@Body() dto: CreateExpenseReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.create(dto, user);
  }

  @Get()
  @RequirePermission('expenses', 'view')
  @ApiOperation({ summary: 'List expense report folders', description: 'Requires expenses:view. Paginated + scoped (own/roster/all); each folder carries its derived status, reimbursable total, and aggregated Alert/Warning count.' })
  @ApiOkResponse({ type: ExpenseReportPageResponse })
  list(@Query() query: ListExpenseReportsQuery, @CurrentUser() user: AuthUser) {
    return this.reports.list(query, user);
  }

  @Get(':id')
  @RequirePermission('expenses', 'view')
  @ApiOperation({ summary: 'Get a folder with its items', description: 'Requires expenses:view (scoped). Includes each item + its derived validation.' })
  @ApiOkResponse({ type: ExpenseReportResponse })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.reports.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('expenses', 'create')
  @ApiOperation({ summary: 'Rename a folder / adjust its week', description: 'Requires expenses:create + folder ownership (or an editor in scope).' })
  @ApiOkResponse({ type: ExpenseReportResponse })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermission('expenses', 'create')
  @ApiOperation({ summary: 'Delete a folder (cascades its unapproved items)', description: 'Requires expenses:create + ownership. 422 if the folder contains any approved item (preserved).' })
  @ApiOkResponse({ description: 'Deleted.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.reports.remove(id, user);
  }

  @Post(':id/submit')
  @RequirePermission('expenses', 'create')
  @ApiOperation({ summary: 'Submit the folder for approval', description: 'Requires expenses:create + ownership. Transitions the folder’s draft/returned items → submitted and notifies the approver.' })
  @ApiOkResponse({ type: ExpenseReportResponse })
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.reports.submit(id, user);
  }

  @Post(':id/review')
  @RequirePermission('expenses', 'approve')
  @ApiOperation({ summary: 'Review the whole folder (bulk over its items)', description: 'Requires expenses:approve. Applies one decision (approve|reject|send_back) to the folder’s submitted/returned items; a foreign item needing a manual FX rate is skipped (open it for the per-item FX dialog).' })
  @ApiOkResponse({ type: ExpenseReportResponse })
  review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.review(id, dto, user);
  }
}
