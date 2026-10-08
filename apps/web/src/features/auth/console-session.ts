import { consoleApi, ConsoleApiError } from "@/lib/console-api";

export type ConsoleSession = {
  authenticated: true;
  user: { sub: string; iss: string; email: string; name: string };
};

export async function getConsoleSession(
  signal?: AbortSignal
): Promise<ConsoleSession> {
  const response = await consoleApi.get<ConsoleSession>("/auth/session", {
    signal,
  });
  if (
    response?.authenticated !== true ||
    !response.user ||
    typeof response.user.sub !== "string" ||
    typeof response.user.iss !== "string" ||
    typeof response.user.email !== "string" ||
    typeof response.user.name !== "string"
  ) {
    throw new ConsoleApiError({
      status: 503,
      message: "No se pudo validar la sesión de Console.",
    });
  }
  const { sub, iss, email, name } = response.user;
  return { authenticated: true, user: { sub, iss, email, name } };
}

export async function logoutConsole(locale: string) {
  const { logoutUrl } = await consoleApi.post<{ logoutUrl?: string }>(
    "/auth/logout"
  );
  if (!logoutUrl) throw new Error("Identity logout URL is missing");
  const response = await fetch(logoutUrl, {
    credentials: "include",
    method: "POST",
  });
  if (!response.ok) throw new Error("Identity logout failed");
  window.location.assign(`/${locale}`);
}
