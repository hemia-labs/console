import type { IdentityOAuthClient, OAuthClientStatus } from "./types";

export function oauthClientId(client: IdentityOAuthClient) {
  return String(client.id || client.clientId || "");
}

export function oauthClientStatus(client: IdentityOAuthClient): OAuthClientStatus {
  return (client.status ?? "active") as OAuthClientStatus;
}

export function oauthClientDate(client: IdentityOAuthClient, field: "created" | "updated") {
  const raw = field === "created" ? client.createdAt : client.updatedAt;
  if (!raw) return "No disponible";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function joinList(values?: string[]) {
  return values && values.length > 0 ? values.join(", ") : "No configurado";
}

export function parseLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

export function addOAuthScope(scopes: string[], value: string) {
  const scope = value.trim();
  if (!scope || /\s/.test(scope)) {
    return { scopes, error: "Escribe un scope sin espacios." };
  }
  if (scopes.includes(scope)) {
    return { scopes, error: "Este permiso ya está seleccionado." };
  }
  return { scopes: [...scopes, scope], error: null };
}
