import type { Redis } from 'ioredis';
import { RedisSessionStore } from '../../../../src/modules/auth/redis-session-store';

// Minimal in-memory fake of the ioredis surface the store uses.
const fakeRedis = () => {
  const map = new Map<string, string>();
  const calls: Array<[string, ...unknown[]]> = [];
  return {
    map,
    calls,
    async get(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    async set(key: string, value: string, ...rest: unknown[]) {
      calls.push(['set', key, value, ...rest]);
      map.set(key, value);
      return 'OK';
    },
    async del(key: string) {
      map.delete(key);
      return 1;
    },
  } as unknown as Redis & { map: Map<string, string>; calls: unknown[][] };
};

describe('RedisSessionStore', () => {
  it('returns null for missing keys', async () => {
    const store = new RedisSessionStore(fakeRedis());
    await expect(store.get('nope')).resolves.toBeNull();
  });

  it('round-trips JSON values and passes ttl as EX', async () => {
    const redis = fakeRedis();
    const store = new RedisSessionStore(redis);
    await store.set('k', { a: 1 }, 60);
    expect(redis.calls[0]).toEqual(['set', 'k', '{"a":1}', 'EX', 60]);
    await expect(store.get<{ a: number }>('k')).resolves.toEqual({ a: 1 });
  });

  it('deletes a value', async () => {
    const store = new RedisSessionStore(fakeRedis());
    await store.set('k', 'v', 60);
    await store.delete('k');
    await expect(store.get('k')).resolves.toBeNull();
  });
});
