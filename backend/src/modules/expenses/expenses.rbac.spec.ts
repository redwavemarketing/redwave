import 'reflect-metadata';
import {
  ExpenseReportsController,
  ExpenseFieldConfigsController,
  ExpenseExportsController,
} from './expenses.controller';
import { RBAC_KEY } from '../../common/decorators/require-permission.decorator';

const meta = (ctor: any, method: string) => Reflect.getMetadata(RBAC_KEY, ctor.prototype[method]);

describe('Expenses RBAC metadata', () => {
  it('expense-reports declares the expected (expenses, action) on every endpoint', () => {
    expect(meta(ExpenseReportsController, 'create')).toEqual({ moduleKey: 'expenses', action: 'create' });
    expect(meta(ExpenseReportsController, 'list')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseReportsController, 'findOne')).toEqual({ moduleKey: 'expenses', action: 'view' });
    expect(meta(ExpenseReportsController, 'edit')).toEqual({ moduleKey: 'expenses', action: 'edit' });
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
});
