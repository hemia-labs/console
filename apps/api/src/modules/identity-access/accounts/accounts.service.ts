import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../../integrations/hemia-id/hemia-id-admin.types';

@Injectable()
export class AccountsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/accounts',
      auth,
    });
  }

  findActive(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/accounts/active',
      auth,
    });
  }
}
