import 'reflect-metadata';
import {
  ExpenseItemsController,
  ExpenseFieldConfigsController,
  ExpenseExportsController,
} from './expenses.controller';
import { ExpenseReportsController } from './expense-report.controller';
import { RBAC_KEY } from '../../common/decorators/require-permission.decorator';

const meta = (ctor: any, method: string) => Reflect.getMetadata(RBAC_KEY, ctor.prototype[method]);

describe('Expenses RBAC metadata', () => {
  it('expense-items declares the expected (expenses, action) on every endpoint', () => {
    expect(meta(ExpenseItemsController, 'create')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseItemsController, 'list')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseItemsController, 'findOne')).toEqual({ moduleKey: 'expenses', action: 'view' });
    // edit/delete floor at `create` — the SERVICE is the real gate (owner-unapproved / Admin-approved, §5).
    expect(meta(ExpenseItemsController, 'edit')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseItemsController, 'remove')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseItemsController, 'review')).toEqual({ moduleKey: 'expenses', action: 'approve' });
    expect(meta(ExpenseItemsController, 'bulkReview')).toEqual({ moduleKey: 'expenses', action: 'approve' });
    // The receipt URL rides the same view gate as the detail (scoped in the service query).
    expect(meta(ExpenseItemsController, 'receiptUrl')).toEqual({ moduleKey: 'expenses', action: 'view' });
  });

  it('expense-report folders: create/manage floor at expenses:create; review at expenses:approve', () => {
    expect(meta(ExpenseReportsController, 'create')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseReportsController, 'list')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseReportsController, 'findOne')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseReportsController, 'update')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseReportsController, 'remove')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseReportsController, 'submit')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseReportsController, 'review')).toEqual({ moduleKey: 'expenses', action: 'approve' });
  });

  it('field-configs require expenses:view to read and expenses:edit to configure', () => {
    expect(meta(ExpenseFieldConfigsController, 'list')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseFieldConfigsController, 'create')).toEqual({ moduleKey: 'expenses', action: 'edit' });
  });

  it('exports require expenses:view to list and expenses:export to generate', () => {
    expect(meta(ExpenseExportsController, 'list')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseExportsController, 'create')).toEqual({ moduleKey: 'expenses', action: 'export' });
  });

  // The legacy /v1/expense-receipts upload is GONE — receipts ride the unified POST /v1/files pipeline
  // (authenticated; the claim at item create/edit is the consumer-side gate).
});
