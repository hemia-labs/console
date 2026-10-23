import { consoleApi, ConsoleApiError } from "@/lib/console-api";
import {
  catalogPath,
  type CatalogChoices,
  type System,
  type SystemDraft,
} from "./types";

export function getSystems(signal?: AbortSignal) {
  return consoleApi.get<System[]>(`${catalogPath}/systems`, { signal });
}

export async function getSystem(id: string, signal?: AbortSignal) {
  const systems = await getSystems(signal);
  const system = systems.find((item) => item.id === id);
  if (!system)
    throw new ConsoleApiError({
      status: 404,
      message: "Sistema no encontrado.",
    });
  return system;
}

export function getSystemChoices(signal?: AbortSignal) {
  return consoleApi.get<CatalogChoices>(`${catalogPath}/choices`, { signal });
}

export function saveSystem(value: SystemDraft, id?: string) {
  const payload: SystemDraft = {
    code: value.code,
    name: value.name,
    enabled: value.enabled,
    configuration: value.configuration,
    services: value.services.map((service) => ({
      code: service.code,
      name: service.name,
      url: service.url,
      enabled: service.enabled,
      audience: service.audience,
      resource: service.resource,
    })),
    clients: value.clients.map((client) => ({
      oauthIssuer: client.oauthIssuer,
      capabilityCode: client.capabilityCode,
      clientId: client.clientId,
      roles: client.roles,
      enabled: client.enabled,
    })),
  };
  return id
    ? consoleApi.put<System>(
        `${catalogPath}/systems/${encodeURIComponent(id)}`,
        payload,
      )
    : consoleApi.post<System>(`${catalogPath}/systems`, payload);
}

export function createCapabilityClient(
  capabilityCode: string,
  roles: string[],
  clientId: string,
) {
  return consoleApi.post<{
    client: CatalogChoices["clients"][number];
    clientSecret: string;
  }>(`${catalogPath}/clients`, { capabilityCode, roles, clientId });
}
