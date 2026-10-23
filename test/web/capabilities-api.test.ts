import { afterEach, expect, test } from "bun:test";
import {
  getCapability,
  saveCapability,
} from "../../apps/web/src/features/systems/capabilities-api";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const capability = {
  code: "notifications",
  name: "Notificaciones",
  functions: [],
  schema: { fields: [{ key: "mode", label: "Modo", type: "string" as const }] },
};

test("direct edit resolves the capability by its stable code and preserves cancellation", async () => {
  const controller = new AbortController();
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    expect(init?.signal).toBe(controller.signal);
    return Response.json([capability]);
  }) as typeof fetch;
  expect(await getCapability("notifications", controller.signal)).toEqual(
    capability,
  );
  await expect(
    getCapability("missing", controller.signal),
  ).rejects.toMatchObject({ status: 404, message: "Capacidad no encontrada." });
});

test("saving an edited capability sends only its configuration contract", async () => {
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(capability);
    return Response.json(capability);
  }) as typeof fetch;
  await saveCapability({
    ...capability,
    createdAt: "not part of the payload",
  } as typeof capability);
});
