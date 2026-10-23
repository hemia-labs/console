import { consoleApi, ConsoleApiError } from "@/lib/console-api";
import { catalogPath, type Capability } from "./types";

export function getCapabilities(signal?: AbortSignal) {
  return consoleApi.get<Capability[]>(`${catalogPath}/capabilities`, {
    signal,
  });
}

export async function getCapability(code: string, signal?: AbortSignal) {
  const capabilities = await getCapabilities(signal);
  const capability = capabilities.find((item) => item.code === code);
  if (!capability)
    throw new ConsoleApiError({
      status: 404,
      message: "Capacidad no encontrada.",
    });
  return capability;
}

export function saveCapability(value: Capability) {
  return consoleApi.post(`${catalogPath}/capabilities`, {
    code: value.code,
    name: value.name,
    schema: value.schema,
    functions: value.functions ?? [],
  });
}
