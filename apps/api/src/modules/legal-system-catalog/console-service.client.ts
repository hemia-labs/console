import { MachineClient } from '@hemia/auth';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';

@Injectable()
export class ConsoleServiceClient {
  private readonly clients = new Map<string, MachineClient>();
  constructor(private readonly config: ConfigService) {}
  endpoint(value: string) {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.hash ||
      (url.protocol !== 'https:' &&
        !(
          url.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
          process.env.NODE_ENV !== 'production'
        ))
    )
      throw new ServiceUnavailableException(
        'El servicio necesita una dirección segura.',
      );
    return url;
  }
  async request<T>(
    req: ConsoleRequest,
    target: { url: string; resource: string; audience?: string; scope: string },
    method: 'GET' | 'POST' | 'PUT',
    body?: unknown,
  ): Promise<T> {
    if (!req.user?.sub || !req.user.iss)
      throw new UnauthorizedException('Falta el operador de Console.');
    const url = this.endpoint(target.url);
    if (url.origin !== target.resource)
      throw new ServiceUnavailableException('Destino OAuth inválido.');
    const key = JSON.stringify([
      target.resource,
      target.audience,
      target.scope,
    ]);
    try {
      let client = this.clients.get(key);
      if (!client) {
        const issuer = this.endpoint(
          this.config.getOrThrow<string>('hemiaId.baseUrl'),
        );
        const tokenUrl = new URL(
          this.config.getOrThrow<string>('hemiaId.service.tokenUrl'),
          issuer,
        );
        client = new MachineClient({
          issuer: issuer.href,
          tokenUrl: tokenUrl.href,
          clientId: this.config.getOrThrow<string>('hemiaId.service.clientId'),
          clientSecret: this.config.getOrThrow<string>(
            'hemiaId.service.clientSecret',
          ),
          allowHttpLoopback: process.env.NODE_ENV !== 'production',
          requestTimeoutMs: 15000,
          destinations: {
            api: {
              baseUrl: target.resource,
              resource: target.resource,
              audience: target.audience,
              scopes: [target.scope],
            },
          },
        });
        this.clients.set(key, client);
      }
      const response = await client.request('api', url.href, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-console-actor-subject': req.user.sub,
          'x-console-actor-issuer': req.user.iss,
          'x-hemia-actor-subject': req.user.sub,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) {
        if (response.status === 401) this.clients.delete(key);
        let message = 'El servicio no pudo completar la operación.';
        if (
          response.status >= 400 &&
          response.status < 500 &&
          ![401, 403].includes(response.status)
        ) {
          const error = (await response.json().catch(() => null)) as {
            message?: unknown;
          } | null;
          if (typeof error?.message === 'string') message = error.message;
          else if (
            Array.isArray(error?.message) &&
            error.message.every((item) => typeof item === 'string')
          )
            message = error.message.join(' ');
        }
        throw new HttpException(
          message,
          [401, 403].includes(response.status) ? 503 : response.status,
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No se pudo comprobar la conexión con el servicio. Reintenta sin crear otro cliente.',
      );
    }
  }
}
