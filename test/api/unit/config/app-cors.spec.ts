import { ConfigService } from '@nestjs/config';
import { buildAppCorsOptions } from 'src/config/app-cors';

describe('buildAppCorsOptions', () => {
  it('keeps wildcard only when credentials are disabled', () => {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'app.corsOrigins': ['*', 'http://localhost:3000'],
          'app.corsCredentials': false,
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    expect(buildAppCorsOptions(config)).toEqual({
      origin: ['*', 'http://localhost:3000'],
      credentials: false,
    });
  });

  it('removes wildcard when credentials are enabled', () => {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'app.corsOrigins': ['*', 'http://localhost:3000'],
          'app.corsCredentials': true,
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    expect(buildAppCorsOptions(config)).toEqual({
      origin: ['http://localhost:3000'],
      credentials: true,
    });
  });
});
