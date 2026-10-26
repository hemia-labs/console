import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../modules/auth/session/redis-session-store';

@Controller('health')
export class HealthController {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    if (this.redis.status !== 'ready') {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const pong = await Promise.race([
        this.redis.ping(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Redis timeout')), 2000);
        }),
      ]);
      if (pong !== 'PONG') throw new Error('Redis unavailable');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    } finally {
      clearTimeout(timer);
    }
  }
}
