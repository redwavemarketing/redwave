import 'reflect-metadata';
import { SalesController } from './sales.controller';
import { RBAC_KEY } from '../../common/decorators/require-permission.decorator';

const meta = (ctor: any, method: string) => Reflect.getMetadata(RBAC_KEY, ctor.prototype[method]);

describe('Sales RBAC metadata', () => {
  it('every endpoint declares the expected (sales, action) so the global guard enforces it', () => {
    expect(meta(SalesController, 'create')).toEqual({ moduleKey: 'sales', action: 'create' });
    expect(meta(SalesController, 'list')).toEqual({ moduleKey: 'sales', action: 'view' });
    expect(meta(SalesController, 'findOne')).toEqual({ moduleKey: 'sales', action: 'view' });
    expect(meta(SalesController, 'edit')).toEqual({ moduleKey: 'sales', action: 'edit' });
    expect(meta(SalesController, 'validate')).toEqual({ moduleKey: 'sales', action: 'approve' });
    expect(meta(SalesController, 'setGreenfield')).toEqual({
      moduleKey: 'sales',
      action: 'approve',
    });
    expect(meta(SalesController, 'bulkValidate')).toEqual({
      moduleKey: 'sales',
      action: 'approve',
    });
    expect(meta(SalesController, 'remove')).toEqual({ moduleKey: 'sales', action: 'delete' });
  });
});
