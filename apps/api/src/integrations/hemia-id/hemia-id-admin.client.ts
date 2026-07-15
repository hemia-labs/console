import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditRequestContext } from '../../common/audit/audit-request-context';
import {
  HemiaIdAdminRequestOptions,
  HemiaIdAdminResponse,
  HemiaIdAdminResponseWithMetadata,
  HemiaIdServiceTokenResponse,
} from './hemia-id-admin.types';

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'clientid',
  'client_id',
  'clientsecret',
  'client_secret',
  'password',
  'access_token',
  'refresh_token',
];

const TOKEN_REFRESH_MARGIN_MS = 30_000;

@Injectable()
export class HemiaIdAdminClient {
  private cachedServiceAccessToken?: string;
  private cachedServiceAccessTokenExpiresAt = 0;

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly auditRequestContext?: AuditRequestContext,
  ) {}

  async request<T>(options: HemiaIdAdminRequestOptions): Promise<T> {
    const response = await this.executeRequest(options);
    return (await this.parseResponse(response)) as T;
  }

  async requestService<T>(options: HemiaIdAdminRequestOptions): Promise<T> {
    const response = await this.executeServiceRequest(options);
    return (await this.parseResponse(response)) as T;
  }

  async requestWithMetadata<T>(
    options: HemiaIdAdminRequestOptions,
  ): Promise<HemiaIdAdminResponseWithMetadata<T>> {
    const response = await this.executeRequest(options);

    return {
      body: (await this.parseResponse(response)) as T,
      metadata: this.extractMetadata(response),
    };
  }

  async requestWithHeaders<T>(
    options: HemiaIdAdminRequestOptions,
  ): Promise<HemiaIdAdminResponse<T>> {
    const response = await this.executeRequest(options);

    return {
      body: (await this.parseResponse(response)) as T,
      setCookie: this.extractSetCookie(response),
    };
  }

  private async executeRequest(
    options: HemiaIdAdminRequestOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getTimeoutMs(),
    );

    try {
      const response = await fetch(this.buildUrl(options), {
        method: options.method,
        headers: this.buildHeaders(options),
        body: this.buildBody(options),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.recordUpstreamCall(options, response);
        throw await this.toHttpException(response);
      }

      this.recordUpstreamCall(options, response);
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ServiceUnavailableException('Hemia ID Admin API unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async executeServiceRequest(
    options: HemiaIdAdminRequestOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getTimeoutMs(),
    );

    try {
      const response = await fetch(this.buildUrl(options), {
        method: options.method,
        headers: await this.buildServiceHeaders(options),
        body: this.buildBody(options),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.recordUpstreamCall(options, response);
        throw await this.toHttpException(response);
      }

      this.recordUpstreamCall(options, response);
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ServiceUnavailableException('Hemia ID Admin API unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getServiceAccessToken(): Promise<string> {
    if (
      this.cachedServiceAccessToken &&
      Date.now() <
        this.cachedServiceAccessTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS
    ) {
      return this.cachedServiceAccessToken;
    }

    const clientId = this.config.get<string>('hemiaId.service.clientId');
    const clientSecret = this.config.get<string>('hemiaId.service.clientSecret');

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Hemia ID service credentials unavailable',
      );
    }

    const response = await this.requestServiceToken(clientId, clientSecret);
    const payload = (await this.parseResponse(
      response,
    )) as HemiaIdServiceTokenResponse;

    if (
      typeof payload.access_token !== 'string' ||
      payload.access_token.length === 0
    ) {
      throw new ServiceUnavailableException(
        'Hemia ID service token response invalid',
      );
    }

    this.cachedServiceAccessToken = payload.access_token;
    this.cachedServiceAccessTokenExpiresAt =
      Date.now() +
      (typeof payload.expires_in === 'number' ? payload.expires_in : 300) *
        1000;

    return payload.access_token;
  }

  private async requestServiceToken(
    clientId: string,
    clientSecret: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getTimeoutMs(),
    );

    try {
      const scope = this.config.get<string>('hemiaId.service.scopes');
      const body: Record<string, string> = {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      };

      if (scope) {
        body.scope = scope;
      }

      const response = await fetch(this.buildServiceTokenUrl(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.toHttpException(response);
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ServiceUnavailableException('Hemia ID Admin API unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(options: HemiaIdAdminRequestOptions): string {
    const baseUrl = this.withoutTrailingSlash(
      this.config.get<string>('hemiaId.baseUrl') ?? 'http://localhost:3000',
    );
    const adminPrefix = this.withSlashes(
      this.config.get<string>('hemiaId.adminPrefix') ?? '/api/v1',
    );
    const path = this.withoutLeadingSlash(options.path);
    const url = new URL(`${baseUrl}${adminPrefix}${path}`);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (item !== undefined && item !== null) {
          url.searchParams.append(key, String(item));
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(options: HemiaIdAdminRequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (options.auth?.authorization) {
      headers.Authorization = options.auth.authorization;
    }

    if (options.auth?.cookie) {
      headers.Cookie = options.auth.cookie;
    }

    if (options.auth?.tenantId) {
      headers['X-Tenant-Id'] = options.auth.tenantId;
    }

    if (this.shouldSendBody(options)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private async buildServiceHeaders(
    options: HemiaIdAdminRequestOptions,
  ): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${await this.getServiceAccessToken()}`,
    };

    if (this.shouldSendBody(options)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildServiceTokenUrl(): string {
    const baseUrl = this.withoutTrailingSlash(
      this.config.get<string>('hemiaId.baseUrl') ?? 'http://localhost:3000',
    );
    const tokenUrl = this.withLeadingSlash(
      this.config.get<string>('hemiaId.service.tokenUrl') ?? '/oauth/token',
    );

    return `${baseUrl}${tokenUrl}`;
  }

  private buildBody(options: HemiaIdAdminRequestOptions): BodyInit | undefined {
    if (!this.shouldSendBody(options)) {
      return undefined;
    }

    return JSON.stringify(options.body);
  }

  private shouldSendBody(options: HemiaIdAdminRequestOptions): boolean {
    return (
      options.body !== undefined &&
      options.method !== 'GET' &&
      options.method !== 'HEAD'
    );
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private extractSetCookie(response: Response): string[] {
    const headers = response.headers as Headers & {
      getSetCookie?: () => string[];
      raw?: () => Record<string, string[]>;
    };

    const getSetCookie = headers.getSetCookie?.();
    if (getSetCookie?.length) {
      return getSetCookie;
    }

    const rawSetCookie = headers.raw?.()['set-cookie'];
    if (rawSetCookie?.length) {
      return rawSetCookie;
    }

    const setCookie = response.headers.get('set-cookie');
    return setCookie ? [setCookie] : [];
  }

  private extractMetadata(response: Response) {
    return {
      requestId:
        response.headers.get('x-request-id') ??
        response.headers.get('x-correlation-id') ??
        undefined,
    };
  }

  private recordUpstreamCall(
    options: HemiaIdAdminRequestOptions,
    response: Response,
  ): void {
    this.auditRequestContext?.addUpstreamCall({
      source: 'admin',
      method: options.method,
      path: options.path,
      requestId: this.extractMetadata(response).requestId,
    });
  }

  private async toHttpException(response: Response): Promise<HttpException> {
    const message = await this.getSafeErrorMessage(response);

    switch (response.status) {
      case 400:
      case 422:
        return new BadRequestException(message);
      case 401:
        return new UnauthorizedException(message);
      case 403:
        return new ForbiddenException(message);
      case 404:
        return new NotFoundException(message);
      case 409:
        return new ConflictException(message);
      default:
        return new ServiceUnavailableException(
          response.status >= 500 ? message : 'Hemia ID Admin API request failed',
        );
    }
  }

  private async getSafeErrorMessage(response: Response): Promise<string | string[]> {
    const fallback = this.defaultErrorMessage(response.status);
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      return fallback;
    }

    try {
      const payload = (await response.json()) as { message?: unknown };
      const message = payload.message;

      if (typeof message === 'string' && this.isSafeMessage(message)) {
        return message;
      }

      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === 'string') &&
        message.every((item) => this.isSafeMessage(item))
      ) {
        return message;
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  private isSafeMessage(message: string): boolean {
    const normalized = message.toLowerCase().replace(/[\s-]/g, '_');
    return !SENSITIVE_KEYS.some((key) => normalized.includes(key));
  }

  private defaultErrorMessage(status: number): string {
    if (status >= 500) {
      return 'Hemia ID Admin API unavailable';
    }

    return 'Hemia ID Admin API request failed';
  }

  private getTimeoutMs(): number {
    return this.config.get<number>('hemiaId.timeoutMs') ?? 5000;
  }

  private withSlashes(value: string): string {
    return `/${this.withoutLeadingSlash(this.withoutTrailingSlash(value))}/`;
  }

  private withLeadingSlash(value: string): string {
    return value.startsWith('/') ? value : `/${value}`;
  }

  private withoutLeadingSlash(value: string): string {
    return value.replace(/^\/+/, '');
  }

  private withoutTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
  }
}
