import { describe, expect, test } from "bun:test";
import { breadcrumbsFor } from "../../apps/web/src/lib/nav";

describe("OAuth client breadcrumbs", () => {
  const path =
    "/es/identity/oauth-clients/f12d7abc-7da7-464d-9bbd-6a67cc5a1eb7";

  test("uses a readable loading label instead of formatting the UUID", () => {
    expect(breadcrumbsFor(path, "es").map((item) => item.label)).toEqual([
      "Hemia",
      "Identity",
      "OAuth clients",
      "Detalle",
    ]);
  });

  test("shows the loaded client ID and keeps the parent list linked", () => {
    const items = breadcrumbsFor(path, "es", "console-web");
    expect(items.at(-1)).toEqual({ label: "console-web" });
    expect(items.at(-2)?.href).toBe("/es/identity/oauth-clients");
  });

  test("keeps create, edit and list labels independent of a detail title", () => {
    expect(
      breadcrumbsFor("/identity/oauth-clients/new", "es", "console-web").at(-1)
        ?.label,
    ).toBe("Crear");
    expect(
      breadcrumbsFor(`${path}/edit`, "es", "console-web").at(-1)?.label,
    ).toBe("Editar");
    expect(
      breadcrumbsFor("/identity/oauth-clients", "es", "console-web").at(-1)
        ?.label,
    ).toBe("OAuth clients");
  });

  test("links the loaded client before the current edit page", () => {
    const items = breadcrumbsFor(`${path}/edit`, "es", "console-web");
    expect(items.at(-2)).toEqual({ href: path, label: "console-web" });
    expect(items.at(-1)).toEqual({ label: "Editar" });
  });
});

describe("Capability catalog breadcrumbs", () => {
  test("new page links back to the catalog", () => {
    const items = breadcrumbsFor("/es/catalogs/system-capabilities/new", "es");
    expect(items.at(-2)).toEqual({
      href: "/es/catalogs/system-capabilities",
      label: "Capacidades",
    });
    expect(items.at(-1)).toEqual({ label: "Crear" });
  });
  test("edit page identifies the selected capability without a nonexistent detail link", () => {
    const items = breadcrumbsFor(
      "/es/catalogs/system-capabilities/legalAcceptances/edit",
      "es",
      "Aceptaciones legales",
    );
    expect(items.at(-3)).toEqual({
      href: "/es/catalogs/system-capabilities",
      label: "Capacidades",
    });
    expect(items.at(-2)).toEqual({ label: "Aceptaciones legales" });
    expect(items.at(-1)).toEqual({ label: "Editar" });
    expect(
      breadcrumbsFor(
        "/es/catalogs/system-capabilities/legalAcceptances/edit",
        "es",
      ).at(-2),
    ).toEqual({ label: "Capacidad" });
  });
});

describe("System catalog breadcrumbs", () => {
  const path = "/es/catalogs/systems/820a64ec-bb23-41d9-b744-3bf2a6815326/edit";
  test("new page links back to the systems catalog", () => {
    const items = breadcrumbsFor("/es/catalogs/systems/new", "es");
    expect(items.at(-2)).toEqual({
      href: "/es/catalogs/systems",
      label: "Sistemas",
    });
    expect(items.at(-1)).toEqual({ label: "Crear" });
  });
  test("edit identifies the loaded system without linking a nonexistent detail page", () => {
    const items = breadcrumbsFor(path, "es", "Balanz");
    expect(items.at(-3)).toEqual({
      href: "/es/catalogs/systems",
      label: "Sistemas",
    });
    expect(items.at(-2)).toEqual({ label: "Balanz" });
    expect(items.at(-1)).toEqual({ label: "Editar" });
    expect(breadcrumbsFor(path, "es").at(-2)).toEqual({ label: "Sistema" });
  });
});
