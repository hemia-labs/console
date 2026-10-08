export type AccessAdminMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type AccessAdminQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface AccessAdminRequestOptions {
  method: AccessAdminMethod;
  path: string;
  query?: Record<string, AccessAdminQueryValue | AccessAdminQueryValue[]>;
  body?: unknown;
}

export interface AccessAdminErrorPayload {
  type?: unknown;
  title?: unknown;
  status?: unknown;
  code?: unknown;
  detail?: unknown;
  trace_id?: unknown;
}

export interface AccessAdminTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
}
