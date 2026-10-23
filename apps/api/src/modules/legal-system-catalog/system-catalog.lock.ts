import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type Redis from 'ioredis';
import { REDIS } from '../auth/session/redis-session-store';

const KEY = 'console:system-catalog:write:v1';
const LEASE_MS = 30_000;
const RENEW =
  "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('pexpire',KEYS[1],ARGV[2]) else return 0 end";
const RELEASE =
  "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";

@Injectable()
export class SystemCatalogLock {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async run<T>(
    work: (assertHeld: () => Promise<void>) => Promise<T>,
  ): Promise<T> {
    const token = randomUUID();
    const deadline = performance.now() + 5_000;
    let expiresAt = 0;
    for (;;) {
      const started = performance.now();
      const acquired = await this.command(
        this.redis.set(KEY, token, 'PX', LEASE_MS, 'NX'),
      );
      if (acquired === 'OK') {
        expiresAt = started + LEASE_MS;
        break;
      }
      if (performance.now() >= deadline)
        throw new ConflictException(
          'Otro cambio de sistemas está en curso. Vuelve a intentar.',
        );
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
    let lost = false;
    let renewal: Promise<void> | undefined;
    const unavailable = () =>
      new ServiceUnavailableException(
        'Se perdió el bloqueo del catálogo. Vuelve a comprobar antes de guardar.',
      );
    const assertHeld = async () => {
      if (lost || performance.now() >= expiresAt) {
        lost = true;
        throw unavailable();
      }
      if (renewal) return renewal;
      const started = performance.now();
      renewal = (async () => {
        try {
          const owned = await this.command(
            this.redis.eval(RENEW, 1, KEY, token, String(LEASE_MS)),
          );
          if (owned !== 1 || performance.now() >= expiresAt)
            throw unavailable();
          expiresAt = started + LEASE_MS;
        } catch {
          lost = true;
          throw unavailable();
        }
      })().finally(() => {
        renewal = undefined;
      });
      return renewal;
    };
    const timer = setInterval(() => {
      void assertHeld().catch(() => {
        lost = true;
      });
    }, LEASE_MS / 3);
    timer.unref();
    try {
      await assertHeld();
      const result = await work(assertHeld);
      await assertHeld();
      return result;
    } finally {
      clearInterval(timer);
      // Never delete a successor's lease after expiration or a connection loss.
      await this.command(this.redis.eval(RELEASE, 1, KEY, token)).catch(
        () => undefined,
      );
    }
  }

  private async command<T>(pending: Promise<T>): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        pending,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new ServiceUnavailableException(
                  'Redis no pudo confirmar el bloqueo del catálogo.',
                ),
              ),
            2_000,
          );
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
