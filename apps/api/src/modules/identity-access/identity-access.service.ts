import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { HemiaIdHealthDto } from './dtos/hemia-id-health.dto';

@Injectable()
export class IdentityAccessService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  async getHemiaIdHealth(auth: HemiaIdAdminAuth): Promise<HemiaIdHealthDto> {
    const [hemiaId, database] = await Promise.all([
      this.hemiaIdAdminClient.request<unknown>({
        method: 'GET',
        path: '/health',
        auth,
      }),
      this.hemiaIdAdminClient.request<unknown>({
        method: 'GET',
        path: '/health/db',
        auth,
      }),
    ]);

    return {
      status: 'ok',
      hemiaId,
      database,
    };
  }
}
