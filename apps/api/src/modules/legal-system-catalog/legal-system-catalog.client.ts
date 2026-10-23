import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';
import { ConsoleServiceClient } from './console-service.client';
@Injectable()
export class LegalSystemCatalogClient {
  constructor(
    private readonly config: ConfigService,
    private readonly services: ConsoleServiceClient,
  ) {}
  request(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    req: ConsoleRequest,
    body?: unknown,
  ): Promise<unknown> {
    const base = this.services.endpoint(
      this.config.getOrThrow<string>('legalAdmin.baseUrl'),
    );
    return this.services.request(
      req,
      {
        url: new URL(`/v1/legal/system-catalog/${path}`, base).href,
        resource: base.origin,
        scope: method === 'GET' ? 'legal.systems.read' : 'legal.systems.write',
      },
      method,
      body,
    );
  }
}
