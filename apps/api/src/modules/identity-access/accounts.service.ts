import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import {
  HemiaIdAdminAuth,
  HemiaIdAdminResponse,
} from '../../integrations/hemia-id/hemia-id-admin.types';
import { SwitchAccountDto } from './dtos/switch-account.dto';

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

  switch(
    dto: SwitchAccountDto,
    auth: HemiaIdAdminAuth,
  ): Promise<HemiaIdAdminResponse<unknown>> {
    return this.hemiaIdAdminClient.requestWithHeaders({
      method: 'POST',
      path: '/accounts/switch',
      body: dto,
      auth,
    });
  }

  remove(accountIndex: number, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/accounts/${accountIndex}`,
      auth,
    });
  }
}
