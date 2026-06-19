import type { Request } from 'express';
import { HemiaIdAdminAuth } from '../../../integrations/hemia-id/hemia-id-admin.types';

export const extractHemiaIdAuth = (request: Request): HemiaIdAdminAuth => {
  const auth: HemiaIdAdminAuth = {};

  if (request.headers.authorization) {
    auth.authorization = request.headers.authorization;
  }

  if (request.headers.cookie) {
    auth.cookie = request.headers.cookie;
  }

  return auth;
};
