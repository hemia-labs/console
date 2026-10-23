import { afterEach, expect, test } from "bun:test";
import {
  getSystem,
  saveSystem,
} from "../../apps/web/src/features/systems/systems-api";
import type { System } from "../../apps/web/src/features/systems/types";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const system: System = {
  id: "system-id",
  code: "balanz",
  name: "Balanz",
  enabled: true,
  configuration: {
    notifications: { retries: 0, enabled: false },
    legalAcceptances: { contextService: "verify" },
  },
  services: [
    {
      code: "verify",
      name: "Verificar",
      url: "https://other.example/check",
      audience: "support-api",
      resource: "https://other.example",
      enabled: true,
    },
  ],
  clients: [
    {
      clientId: "collector",
      oauthIssuer: "https://identity.example",
      capabilityCode: "legalAcceptances",
      roles: ["collector"],
      enabled: true,
    },
  ],
};

test("direct edit resolves a system by ID, forwards cancellation and reports a missing system", async () => {
  const controller = new AbortController();
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    expect(init?.signal).toBe(controller.signal);
    return Response.json([system]);
  }) as typeof fetch;
  expect(await getSystem(system.id, controller.signal)).toEqual(system);
  await expect(getSystem("missing", controller.signal)).rejects.toMatchObject({
    status: 404,
    message: "Sistema no encontrado.",
  });
});

test("create and edit use their respective methods and preserve only the system contract", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(init?.method));
    expect(String(url)).toEndWith(
      init?.method === "POST"
        ? "/legal/system-catalog/systems"
        : "/legal/system-catalog/systems/system-id",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      code: system.code,
      name: system.name,
      enabled: system.enabled,
      configuration: system.configuration,
      services: system.services,
      clients: system.clients,
    });
    return Response.json(system);
  }) as typeof fetch;
  await saveSystem(system);
  await saveSystem(system, system.id);
  expect(calls).toEqual(["POST", "PUT"]);
});
