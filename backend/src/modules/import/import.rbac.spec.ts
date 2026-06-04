import 'reflect-metadata';
import { ImportController } from './import.controller';
import { RBAC_KEY } from '../../common/decorators/require-permission.decorator';

const meta = (ctor: any, method: string) => Reflect.getMetadata(RBAC_KEY, ctor.prototype[method]);

describe('Import RBAC metadata', () => {
  it('declares the expected (import, action) per arch §6.11 — commit is the high-stakes approve', () => {
    expect(meta(ImportController, 'create')).toEqual({ moduleKey: 'import', action: 'create' });
    expect(meta(ImportController, 'list')).toEqual({ moduleKey: 'import', action: 'view' });
    expect(meta(ImportController, 'findOne')).toEqual({ moduleKey: 'import', action: 'view' });
    expect(meta(ImportController, 'reconcile')).toEqual({ moduleKey: 'import', action: 'edit' });
    expect(meta(ImportController, 'commit')).toEqual({ moduleKey: 'import', action: 'approve' });
  });
});
