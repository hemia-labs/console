export type HemiaIdAdminMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE'
  | 'HEAD';

export type HemiaIdAdminQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface HemiaIdAdminAuth {
  authorization?: string;
  cookie?: string;
  tenantId?: string;
}

export interface HemiaIdAdminRequestOptions {
  method: HemiaIdAdminMethod;
  path: string;
  query?: Record<string, HemiaIdAdminQueryValue | HemiaIdAdminQueryValue[]>;
  body?: unknown;
  auth?: HemiaIdAdminAuth;
}

export interface HemiaIdAdminResponse<T = unknown> {
  body: T;
  setCookie: string[];
}

export interface HemiaIdAdminMetadata {
  requestId?: string;
}

export interface HemiaIdAdminResponseWithMetadata<T = unknown> {
  body: T;
  metadata: HemiaIdAdminMetadata;
}

export interface HemiaIdServiceTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
}
