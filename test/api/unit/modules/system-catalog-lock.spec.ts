import type Redis from 'ioredis';
import { SystemCatalogLock } from '../../../../apps/api/src/modules/legal-system-catalog/system-catalog.lock';

function fixture() {
  let owner: string | undefined;
  const redis = {
    set: jest.fn((_key: string, token: string) => {
      if (owner) return Promise.resolve(null);
      owner = token;
      return Promise.resolve('OK');
    }),
    eval: jest.fn(
      (script: string, _count: number, _key: string, token: string) => {
        if (owner !== token) return Promise.resolve(0);
        if (script.includes("'del'")) owner = undefined;
        return Promise.resolve(1);
      },
    ),
  };
  return {
    redis,
    replace: (token: string) => {
      owner = token;
    },
    owner: () => owner,
    lock: () => new SystemCatalogLock(redis as unknown as Redis),
  };
}
afterEach(() => jest.useRealTimers());
it('serializes separate instances so both saves retain the latest state', async () => {
  const f = fixture();
  let value = 0;
  const save = () =>
    f.lock().run(async (assertHeld) => {
      const previous = value;
      await new Promise((resolve) => setTimeout(resolve, 15));
      await assertHeld();
      value = previous + 1;
    });
  await Promise.all([save(), save()]);
  expect(value).toBe(2);
  expect(f.owner()).toBeUndefined();
});
it('renews leases while work is pending', async () => {
  jest.useFakeTimers();
  const f = fixture();
  let finish!: () => void;
  const result = f.lock().run(
    async () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await jest.advanceTimersByTimeAsync(0);
  await jest.advanceTimersByTimeAsync(21_000);
  expect(
    f.redis.eval.mock.calls.filter(([script]) => script.includes('pexpire'))
      .length,
  ).toBeGreaterThanOrEqual(3);
  finish();
  await result;
  expect(f.owner()).toBeUndefined();
});
it('blocks the next mutation after losing ownership and does not delete its successor', async () => {
  const f = fixture();
  const mutate = jest.fn();
  await expect(
    f.lock().run(async (assertHeld) => {
      f.replace('successor');
      await assertHeld();
      mutate();
    }),
  ).rejects.toMatchObject({ status: 503 });
  expect(mutate).not.toHaveBeenCalled();
  expect(f.owner()).toBe('successor');
});
it('releases the lease after a failed operation', async () => {
  const f = fixture();
  await expect(
    f.lock().run(() => Promise.reject(new Error('failed'))),
  ).rejects.toThrow('failed');
  await expect(f.lock().run(() => Promise.resolve('next'))).resolves.toBe(
    'next',
  );
});
it('fails closed when Redis is unavailable', async () => {
  const f = fixture();
  f.redis.eval.mockRejectedValue(new Error('offline'));
  const work = jest.fn();
  await expect(f.lock().run(work)).rejects.toMatchObject({ status: 503 });
  expect(work).not.toHaveBeenCalled();
});
