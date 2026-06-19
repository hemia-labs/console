import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HemiaIdAdminRequestOptions,
  HemiaIdAdminResponse,
} from './hemia-id-admin.types';

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'clientsecret',
  'client_secret',
  'access_token',
  'refresh_token',
];

@Injectable()
export class HemiaIdAdminClient {
  constructor(private readonly config: ConfigService) {}

  async request<T>(options: HemiaIdAdminRequestOptions): Promise<T> {
    const response = await this.executeRequest(options);
    return (await this.parseResponse(response)) as T;
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

    if (this.shouldSendBody(options)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
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

  private withoutLeadingSlash(value: string): string {
    return value.replace(/^\/+/, '');
  }

  private withoutTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
  }
}
