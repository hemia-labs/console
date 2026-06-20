import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export const ensureExternalApiAccess = (request: Request): void => {
  const authorization = request.headers.authorization;
  const cookie = request.headers.cookie;

  if (!authorization && !cookie) {
    throw new UnauthorizedException('Missing auth');
  }
};
