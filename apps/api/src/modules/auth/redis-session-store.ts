import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { SessionStore } from '@hemia/auth';

/** Token DI del cliente ioredis que consume el store. */
export const REDIS = Symbol('REDIS');

/**
 * SessionStore sobre Redis para sesiones SSO, estado PKCE y el token de servicio cacheado.
 * Adaptador puro: serializa a JSON y deja el TTL en manos de Redis (`EX`).
 */
@Injectable()
export class RedisSessionStore implements SessionStore, OnModuleDestroy {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
