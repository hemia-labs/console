import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { HemiaIdHealthDto } from './dtos/hemia-id-health.dto';

@Injectable()
export class IdentityAccessService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  async getHemiaIdHealth(auth: HemiaIdAdminAuth): Promise<HemiaIdHealthDto> {
    const [live, startup, ready] = await Promise.all([
      this.hemiaIdAdminClient.request<unknown>({
        method: 'GET',
        path: '/health/live',
        auth,
      }),
      this.hemiaIdAdminClient.request<unknown>({
        method: 'GET',
        path: '/health/startup',
        auth,
      }),
      this.hemiaIdAdminClient.request<unknown>({
        method: 'GET',
        path: '/health/ready',
        auth,
      }),
    ]);

    return {
      status: 'ok',
      live,
      startup,
      ready,
    };
  }
}
