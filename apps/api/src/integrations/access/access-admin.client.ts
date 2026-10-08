import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditRequestContext } from '../../common/audit/audit-request-context';
import {
  AccessAdminErrorPayload,
  AccessAdminRequestOptions,
  AccessAdminTokenResponse,
} from './access-admin.types';

const TOKEN_REFRESH_MARGIN_MS = 30_000;
const SENSITIVE_KEYS = [
  'authorization',
  'client_id',
  'client_secret',
  'cookie',
  'password',
  'refresh_token',
  'token',
];

@Injectable()
export class AccessAdminClient {
  private cachedAccessToken?: string;
  private cachedAccessTokenExpiresAt = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly auditRequestContext: AuditRequestContext,
  ) {}

  async request<T>(options: AccessAdminRequestOptions): Promise<T> {
    const response = await this.executeRequest(options);
    return (await this.parseResponse(response)) as T;
  }

  async requestAsUser<T>(
    options: AccessAdminRequestOptions,
    accessToken: string,
  ): Promise<T> {
    if (!accessToken || /\s/.test(accessToken))
      throw new UnauthorizedException('Missing user access token');
    const response = await this.executeRequest(options, accessToken);
    return (await this.parseResponse(response)) as T;
  }

  private async executeRequest(
    options: AccessAdminRequestOptions,
    userAccessToken?: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.get<number>('accessAdmin.timeoutMs') ?? 5000,
    );

    try {
      const response = await fetch(this.buildUrl(options), {
        redirect: 'error',
        method: options.method,
        headers: await this.buildHeaders(options, userAccessToken),
        body: this.buildBody(options),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await this.readErrorPayload(response);
        this.recordUpstreamCall(
          options,
          response,
          typeof payload.trace_id === 'string' ? payload.trace_id : undefined,
        );
        throw this.toHttpException(
          response.status,
          payload,
          Boolean(userAccessToken),
        );
      }

      this.recordUpstreamCall(options, response);
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ServiceUnavailableException('Hemia Access API unavailable');
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

    const clientId = this.config.get<string>('accessAdmin.clientId');
    const clientSecret = this.config.get<string>('accessAdmin.clientSecret');

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Hemia Access service credentials unavailable',
      );
    }

    const response = await this.requestToken(clientId, clientSecret);
    const payload = (await this.parseResponse(
      response,
    )) as AccessAdminTokenResponse;

    if (
      typeof payload.access_token !== 'string' ||
      payload.access_token.length === 0
    ) {
      throw new ServiceUnavailableException(
        'Hemia Access service token response invalid',
      );
    }

    this.cachedAccessToken = payload.access_token;
    this.cachedAccessTokenExpiresAt =
      Date.now() +
      (typeof payload.expires_in === 'number' ? payload.expires_in : 300) *
        1000;

    return payload.access_token;
  }

  private async requestToken(
    clientId: string,
    clientSecret: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.get<number>('accessAdmin.timeoutMs') ?? 5000,
    );

    try {
      const body = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: this.config.get<string>('accessAdmin.scopes') ?? '',
      };

      const response = await fetch(
        this.config.getOrThrow<string>('accessAdmin.tokenUrl'),
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Access administrative credentials rejected',
        );
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Hemia Access token endpoint unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(options: AccessAdminRequestOptions): string {
    const path = options.path.replace(/^\/+/, '');
    const url = new URL(
      `${this.config.getOrThrow<string>('accessAdmin.apiBaseUrl')}/${path}`,
    );

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

  private async buildHeaders(
    options: AccessAdminRequestOptions,
    userAccessToken?: string,
  ): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${userAccessToken ?? (await this.getAccessToken())}`,
    };

    if (this.shouldSendBody(options)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildBody(options: AccessAdminRequestOptions): BodyInit | undefined {
    return this.shouldSendBody(options)
      ? JSON.stringify(options.body)
      : undefined;
  }

  private shouldSendBody(options: AccessAdminRequestOptions): boolean {
    return options.body !== undefined && options.method !== 'GET';
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

  private toHttpException(
    status: number,
    payload: AccessAdminErrorPayload,
    userRequest = false,
  ): HttpException {
    const detail = this.safeMessage(payload.detail);
    const title = this.safeMessage(payload.title);
    const fallback = this.defaultErrorMessage(status);
    const message = detail ?? title ?? fallback;
    const errorBody = {
      code: typeof payload.code === 'string' ? payload.code : undefined,
      detail: message,
      message,
      trace_id:
        typeof payload.trace_id === 'string' ? payload.trace_id : undefined,
      type: typeof payload.type === 'string' ? payload.type : undefined,
    };

    if (userRequest && status === 401)
      return new UnauthorizedException(errorBody);
    if (userRequest && status === 403) return new ForbiddenException(errorBody);

    switch (status) {
      case 400:
      case 422:
        return new BadRequestException(errorBody);
      case 401:
      case 403:
        return new ServiceUnavailableException(
          'Access administrative credentials rejected',
        );
      case 404:
        return new NotFoundException(errorBody);
      case 409:
        return new ConflictException(errorBody);
      default:
        return new ServiceUnavailableException(errorBody);
    }
  }

  private async readErrorPayload(
    response: Response,
  ): Promise<AccessAdminErrorPayload> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {};
    }

    try {
      const payload: unknown = await response.json();
      return isAccessAdminErrorPayload(payload) ? payload : {};
    } catch {
      return {};
    }
  }

  private safeMessage(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value) {
      return undefined;
    }

    const normalized = value.toLowerCase().replace(/[\s-]/g, '_');
    return SENSITIVE_KEYS.some((key) => normalized.includes(key))
      ? undefined
      : value;
  }

  private defaultErrorMessage(status: number): string {
    return status >= 500
      ? 'Hemia Access API unavailable'
      : 'Hemia Access API request failed';
  }

  private recordUpstreamCall(
    options: AccessAdminRequestOptions,
    response: Response,
    traceId?: string,
  ): void {
    this.auditRequestContext.addUpstreamCall({
      source: 'admin',
      service: 'access',
      method: options.method,
      path: options.path,
      requestId:
        response.headers.get('x-request-id') ??
        response.headers.get('x-correlation-id') ??
        undefined,
      traceId: traceId ?? response.headers.get('x-trace-id') ?? undefined,
    });
  }
}

const isAccessAdminErrorPayload = (
  value: unknown,
): value is AccessAdminErrorPayload =>
  value !== null && typeof value === 'object';
