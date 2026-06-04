import 'reflect-metadata';
import { ClawbackController } from './clawback.controller';
import { RBAC_KEY } from '../../common/decorators/require-permission.decorator';

const meta = (ctor: any, method: string) => Reflect.getMetadata(RBAC_KEY, ctor.prototype[method]);

describe('Clawback RBAC metadata', () => {
  it('declares the expected (clawback, action) on every endpoint', () => {
    expect(meta(ClawbackController, 'list')).toEqual({ moduleKey: 'clawback', action: 'view' });
    expect(meta(ClawbackController, 'create')).toEqual({ moduleKey: 'clawback', action: 'create' });
    expect(meta(ClawbackController, 'findOne')).toEqual({ moduleKey: 'clawback', action: 'view' });
  });
});
