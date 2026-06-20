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
  HemiaIdExternalRequestOptions,
  HemiaIdExternalResponseWithMetadata,
  HemiaIdExternalTokenResponse,
} from './hemia-id-external.types';

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
export class HemiaIdExternalClient {
  private cachedAccessToken?: string;
  private cachedAccessTokenExpiresAt = 0;

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly auditRequestContext?: AuditRequestContext,
  ) {}

  async request<T>(options: HemiaIdExternalRequestOptions): Promise<T> {
    const response = await this.executeRequest(options);
    return (await this.parseResponse(response)) as T;
  }

  async requestWithMetadata<T>(
    options: HemiaIdExternalRequestOptions,
  ): Promise<HemiaIdExternalResponseWithMetadata<T>> {
    const response = await this.executeRequest(options);

    return {
      body: (await this.parseResponse(response)) as T,
      metadata: this.extractMetadata(response),
    };
  }

  private async executeRequest(
    options: HemiaIdExternalRequestOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getTimeoutMs(),
    );

    try {
      const response = await fetch(this.buildUrl(options), {
        method: options.method,
        headers: await this.buildHeaders(options),
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

      throw new ServiceUnavailableException('Hemia ID External API unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.cachedAccessToken &&
      Date.now() < this.cachedAccessTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS
    ) {
      return this.cachedAccessToken;
    }

    const clientId = this.config.get<string>('hemiaId.external.clientId');
    const clientSecret = this.config.get<string>('hemiaId.external.clientSecret');

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Hemia ID External API credentials unavailable',
      );
    }

    const response = await this.requestToken(clientId, clientSecret);
    const payload = (await this.parseResponse(
      response,
    )) as HemiaIdExternalTokenResponse;
    const accessToken = payload.access_token;
    const expiresIn = payload.expires_in;

    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      throw new ServiceUnavailableException(
        'Hemia ID External API token response invalid',
      );
    }

    this.cachedAccessToken = accessToken;
    this.cachedAccessTokenExpiresAt =
      Date.now() + (typeof expiresIn === 'number' ? expiresIn : 300) * 1000;

    return accessToken;
  }

  private async requestToken(
    clientId: string,
    clientSecret: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getTimeoutMs(),
    );

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });
      const scopes = this.config.get<string>('hemiaId.external.scopes');

      if (scopes) {
        body.set('scope', scopes);
      }

      const response = await fetch(this.buildTokenUrl(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
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

      throw new ServiceUnavailableException('Hemia ID External API unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(options: HemiaIdExternalRequestOptions): string {
    const baseUrl = this.withoutTrailingSlash(
      this.config.get<string>('hemiaId.baseUrl') ?? 'http://localhost:3000',
    );
    const adminPrefix = this.withSlashes(
      this.config.get<string>('hemiaId.adminPrefix') ?? '/api/v1',
    );
    const path = this.withoutLeadingSlash(options.path);
    const url = new URL(`${baseUrl}${adminPrefix}external/${path}`);

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

  private buildTokenUrl(): string {
    const baseUrl = this.withoutTrailingSlash(
      this.config.get<string>('hemiaId.baseUrl') ?? 'http://localhost:3000',
    );
    const tokenUrl = this.withLeadingSlash(
      this.config.get<string>('hemiaId.external.tokenUrl') ?? '/oauth/token',
    );

    return `${baseUrl}${tokenUrl}`;
  }

  private async buildHeaders(
    options: HemiaIdExternalRequestOptions,
  ): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${await this.getAccessToken()}`,
    };

    if (this.shouldSendBody(options)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildBody(options: HemiaIdExternalRequestOptions): BodyInit | undefined {
    if (!this.shouldSendBody(options)) {
      return undefined;
    }

    return JSON.stringify(options.body);
  }

  private shouldSendBody(options: HemiaIdExternalRequestOptions): boolean {
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
          response.status >= 500
            ? message
            : 'Hemia ID External API request failed',
        );
    }
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
    options: HemiaIdExternalRequestOptions,
    response: Response,
  ): void {
    this.auditRequestContext?.addUpstreamCall({
      source: 'external',
      method: options.method,
      path: `/external/${this.withoutLeadingSlash(options.path)}`,
      requestId: this.extractMetadata(response).requestId,
    });
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
      return 'Hemia ID External API unavailable';
    }

    return 'Hemia ID External API request failed';
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
