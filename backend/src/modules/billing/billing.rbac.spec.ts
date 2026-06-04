import 'reflect-metadata';
import { BillingGenerationController } from './billing-generation.controller';
import { StatementsController, InvoicesController } from './billing.controller';
import { RBAC_KEY } from '../../common/decorators/require-permission.decorator';

const meta = (ctor: any, method: string) => Reflect.getMetadata(RBAC_KEY, ctor.prototype[method]);

describe('Billing RBAC metadata', () => {
  it('generation requires billing:create', () => {
    expect(meta(BillingGenerationController, 'generateStatement')).toEqual({ moduleKey: 'billing', action: 'create' });
    expect(meta(BillingGenerationController, 'generateInvoice')).toEqual({ moduleKey: 'billing', action: 'create' });
  });

  it('statement reads require billing:view; export requires billing:export', () => {
    expect(meta(StatementsController, 'list')).toEqual({ moduleKey: 'billing', action: 'view' });
    expect(meta(StatementsController, 'findOne')).toEqual({ moduleKey: 'billing', action: 'view' });
    expect(meta(StatementsController, 'export')).toEqual({ moduleKey: 'billing', action: 'export' });
  });

  it('invoice reads require billing:view; export requires billing:export', () => {
    expect(meta(InvoicesController, 'list')).toEqual({ moduleKey: 'billing', action: 'view' });
    expect(meta(InvoicesController, 'findOne')).toEqual({ moduleKey: 'billing', action: 'view' });
    expect(meta(InvoicesController, 'export')).toEqual({ moduleKey: 'billing', action: 'export' });
  });
});
