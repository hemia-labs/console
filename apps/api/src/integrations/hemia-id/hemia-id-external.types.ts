export type HemiaIdExternalMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE'
  | 'HEAD';

export type HemiaIdExternalQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface HemiaIdExternalRequestOptions {
  method: HemiaIdExternalMethod;
  path: string;
  query?: Record<string, HemiaIdExternalQueryValue | HemiaIdExternalQueryValue[]>;
  body?: unknown;
}

export interface HemiaIdExternalTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
}

export interface HemiaIdExternalMetadata {
  requestId?: string;
}

export interface HemiaIdExternalResponseWithMetadata<T = unknown> {
  body: T;
  metadata: HemiaIdExternalMetadata;
}
