import {
  ConsoleApiError,
  type ConsoleApiQuery,
  type ConsoleApiRequestOptions,
} from "@/lib/console-api.types";

const DEFAULT_CONSOLE_API_BASE_URL = "http://localhost:3001";

function getConsoleApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_CONSOLE_API_BASE_URL?.replace(/\/+$/, "") ??
    DEFAULT_CONSOLE_API_BASE_URL
  );
}

function appendQuery(url: URL, query?: ConsoleApiQuery) {
  if (!query) {
    return;
  }

  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      if (item === null || item === undefined) {
        continue;
      }

      url.searchParams.append(key, String(item));
    }
  }
}

function buildUrl(path: string, query?: ConsoleApiQuery) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(cleanPath, `${getConsoleApiBaseUrl()}/`);
  appendQuery(url, query);
  return url.toString();
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

function readErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      code: undefined,
      details: payload,
      message: undefined,
    };
  }

  const record = payload as Record<string, unknown>;
  const rawMessage = record.message;

  return {
    code: typeof record.code === "string" ? record.code : undefined,
    details: record.details ?? payload,
    message:
      typeof rawMessage === "string"
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage.filter((item) => typeof item === "string").join(", ")
          : undefined,
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: ConsoleApiRequestOptions = {}
): Promise<T> {
  const { authToken, headers, query, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const hasBody = body !== undefined;
  if (hasBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      body: hasBody ? JSON.stringify(body) : undefined,
      credentials: "include",
      headers: requestHeaders,
      method,
    });
  } catch (error) {
    throw new ConsoleApiError({
      details: error,
      message: "No se pudo conectar con Console API.",
      status: null,
    });
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const { code, details, message } = readErrorPayload(payload);

    throw new ConsoleApiError({
      code,
      details,
      message: message ?? `Console API respondio con estado ${response.status}.`,
      status: response.status,
    });
  }

  return payload as T;
}

export const consoleApi = {
  delete<T>(path: string, options?: ConsoleApiRequestOptions) {
    return request<T>("DELETE", path, undefined, options);
  },
  get<T>(path: string, options?: ConsoleApiRequestOptions) {
    return request<T>("GET", path, undefined, options);
  },
  patch<T>(path: string, body?: unknown, options?: ConsoleApiRequestOptions) {
    return request<T>("PATCH", path, body, options);
  },
  post<T>(path: string, body?: unknown, options?: ConsoleApiRequestOptions) {
    return request<T>("POST", path, body, options);
  },
};

export { ConsoleApiError };
