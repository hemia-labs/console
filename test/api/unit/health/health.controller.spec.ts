import { ServiceUnavailableException } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { HealthController } from '../../../../apps/api/src/health/health.controller';

describe('HealthController', () => {
  const redis = { status: 'ready', ping: jest.fn() };
  const controller = new HealthController(redis as unknown as Redis);

  beforeEach(() => {
    redis.status = 'ready';
    redis.ping.mockReset();
  });

  it('reports live without consulting Redis', () => {
    redis.status = 'reconnecting';
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(redis.ping).not.toHaveBeenCalled();
  });

  it('requires a successful Redis ping for readiness', async () => {
    redis.ping.mockResolvedValue('PONG');
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
  });

  it('fails quickly while Redis is disconnected', async () => {
    redis.status = 'reconnecting';
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(redis.ping).not.toHaveBeenCalled();
  });

  it('does not expose Redis errors', async () => {
    redis.ping.mockRejectedValue(new Error('private connection details'));
    await expect(controller.ready()).rejects.toThrow(
      'Service Unavailable Exception',
    );
  });

  it('bounds a stalled Redis ping', async () => {
    jest.useFakeTimers();
    try {
      redis.ping.mockReturnValue(new Promise(() => {}));
      const result = expect(controller.ready()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      await jest.advanceTimersByTimeAsync(2000);
      await result;
    } finally {
      jest.useRealTimers();
    }
  });
});
