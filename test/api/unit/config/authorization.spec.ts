import authorizationConfig from '../../../../apps/api/src/config/authorization.config';
import { envVarsSchema } from '../../../../apps/api/src/config/env.validation';

describe('role authorization configuration', () => {
  const original = process.env.HEMIA_AUTHORIZATION_MODE;
  afterEach(() => {
    if (original === undefined) delete process.env.HEMIA_AUTHORIZATION_MODE;
    else process.env.HEMIA_AUTHORIZATION_MODE = original;
  });
  it('defaults to roles and permits explicit roles', () => {
    delete process.env.HEMIA_AUTHORIZATION_MODE;
    expect(authorizationConfig().mode).toBe('roles');
    process.env.HEMIA_AUTHORIZATION_MODE = 'roles';
    expect(authorizationConfig().mode).toBe('roles');
  });
  it.each(['authenticated', 'invalid', ''])(
    'rejects %s before startup',
    (mode) => {
      process.env.HEMIA_AUTHORIZATION_MODE = mode;
      expect(() => authorizationConfig()).toThrow('HEMIA_AUTHORIZATION_MODE');
      expect(
        envVarsSchema.extract('HEMIA_AUTHORIZATION_MODE').validate(mode).error,
      ).toBeDefined();
    },
  );
});
