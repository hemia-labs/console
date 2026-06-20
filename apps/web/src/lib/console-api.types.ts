export type ConsoleApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type ConsoleApiQuery = Record<
  string,
  ConsoleApiQueryValue | readonly ConsoleApiQueryValue[]
>;

export type ConsoleApiRequestOptions = Omit<
  RequestInit,
  "body" | "credentials" | "method"
> & {
  authToken?: string;
  query?: ConsoleApiQuery;
};

export class ConsoleApiError extends Error {
  code?: string;
  details?: unknown;
  status: number | null;

  constructor({
    code,
    details,
    message,
    status,
  }: {
    code?: string;
    details?: unknown;
    message: string;
    status: number | null;
  }) {
    super(message);
    this.name = "ConsoleApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export type ApiResult<T> =
  | {
      data: T;
      error: null;
      ok: true;
    }
  | {
      data: null;
      error: ConsoleApiError;
      ok: false;
    };
