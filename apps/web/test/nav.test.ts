import { describe, expect, test } from "bun:test";
import { breadcrumbsFor } from "../src/lib/nav";

describe("OAuth client breadcrumbs", () => {
  const path = "/es/identity/oauth-clients/f12d7abc-7da7-464d-9bbd-6a67cc5a1eb7";

  test("uses a readable loading label instead of formatting the UUID", () => {
    expect(breadcrumbsFor(path, "es").map((item) => item.label)).toEqual([
      "Hemia", "Identity", "OAuth clients", "Detalle",
    ]);
  });

  test("shows the loaded client ID and keeps the parent list linked", () => {
    const items = breadcrumbsFor(path, "es", "console-web");
    expect(items.at(-1)).toEqual({ label: "console-web" });
    expect(items.at(-2)?.href).toBe("/es/identity/oauth-clients");
  });

  test("keeps create, edit and list labels independent of a detail title", () => {
    expect(breadcrumbsFor("/identity/oauth-clients/new", "es", "console-web").at(-1)?.label).toBe("Crear");
    expect(breadcrumbsFor(`${path}/edit`, "es", "console-web").at(-1)?.label).toBe("Editar");
    expect(breadcrumbsFor("/identity/oauth-clients", "es", "console-web").at(-1)?.label).toBe("OAuth clients");
  });

  test("links the loaded client before the current edit page", () => {
    const items = breadcrumbsFor(`${path}/edit`, "es", "console-web");
    expect(items.at(-2)).toEqual({ href: path, label: "console-web" });
    expect(items.at(-1)).toEqual({ label: "Editar" });
  });
});
