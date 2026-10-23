import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';
import { ConsoleServiceClient } from './console-service.client';

export type BillingPolicy = {
  clientId: string;
  enabled: boolean;
  products: string[];
  organizationScope: 'organizations' | 'all_for_allowed_products';
  organizationIds?: string[];
  allowedReturnOrigins: string[];
  allowSharedCheckouts: boolean;
};
export type BillingOptions = {
  service: { audience: string; clientId: string };
  products: { id: string; code: string; name: string }[];
  organizations: { id: string; name: string }[];
  policies: BillingPolicy[];
  receivers: {
    productCode: string;
    url: string;
    audience: string;
    resource: string;
    enabled: boolean;
  }[];
};
@Injectable()
export class BillingAdminClient {
  constructor(
    private readonly config: ConfigService,
    private readonly services: ConsoleServiceClient,
  ) {}
  baseUrl() {
    return this.services.endpoint(
      this.config.getOrThrow<string>('legalAdmin.billingBaseUrl'),
    );
  }
  request<T>(
    req: ConsoleRequest,
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const base = this.baseUrl();
    return this.services.request<T>(
      req,
      {
        url: new URL(`/api/v1/billing/integrations/admin/${path}`, base).href,
        resource: base.origin,
        scope:
          method === 'GET'
            ? 'billing.integrations.read'
            : 'billing.integrations.manage',
      },
      method,
      body,
    );
  }
}
