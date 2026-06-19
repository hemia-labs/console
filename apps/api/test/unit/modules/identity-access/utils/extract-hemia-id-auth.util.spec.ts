import type { Request } from 'express';
import { extractHemiaIdAuth } from 'src/modules/identity-access/utils/extract-hemia-id-auth.util';

describe('extractHemiaIdAuth', () => {
  it('extracts authorization and cookie headers', () => {
    const request = {
      headers: {
        authorization: 'Bearer access-token',
        cookie: 'access_token=cookie-token',
      },
    } as Request;

    expect(extractHemiaIdAuth(request)).toEqual({
      authorization: 'Bearer access-token',
      cookie: 'access_token=cookie-token',
    });
  });

  it('omits missing headers', () => {
    const request = {
      headers: {},
    } as Request;

    expect(extractHemiaIdAuth(request)).toEqual({});
  });
});
