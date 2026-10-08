import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateOAuthClientDto } from 'src/modules/identity-access/dtos/create-oauth-client.dto';
import { UpdateOAuthClientDto } from 'src/modules/identity-access/dtos/update-oauth-client.dto';
const destinations = [
  {
    resource: 'http://localhost:4000',
    audience: 'identity-api',
    scopes: ['identity.tokens.introspect'],
  },
  {
    resource: 'http://localhost:3019',
    audience: 'access-api',
    scopes: ['legal.consumer_context.read'],
  },
];
const options = { whitelist: true, forbidNonWhitelisted: true };
describe('Console OAuth destination DTOs', () => {
  it('accepts nested policies for creation and updates without losing the field', () => {
    const create = plainToInstance(CreateOAuthClientDto, {
      clientId: 'legal-service-dev',
      audience: 'identity-api',
      type: 'confidential',
      serviceDestinations: destinations,
    });
    const update = plainToInstance(UpdateOAuthClientDto, {
      serviceDestinations: destinations,
    });
    expect(validateSync(create, options)).toHaveLength(0);
    expect(validateSync(update, options)).toHaveLength(0);
    expect(update.serviceDestinations).toEqual(destinations);
    expect(
      validateSync(
        plainToInstance(UpdateOAuthClientDto, { serviceDestinations: null }),
        options,
      ),
    ).toHaveLength(0);
  });
  it('rejects malformed or duplicated destinations and unknown nested fields', () => {
    for (const serviceDestinations of [
      [],
      [destinations[0], destinations[0]],
      [{ ...destinations[0], resource: 'not-a-url' }],
      [{ ...destinations[0], scopes: ['invalid scope'] }],
      [{ ...destinations[0], audience: '' }],
      [{ ...destinations[0], unexpected: true }],
    ])
      expect(
        validateSync(
          plainToInstance(UpdateOAuthClientDto, { serviceDestinations }),
          options,
        ).length,
      ).toBeGreaterThan(0);
  });
});
