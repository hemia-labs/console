import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogPublication } from "../src/features/access/system-role-catalogs/catalog-publication";
import { CatalogsClient } from "../src/features/access/system-role-catalogs/catalogs-client";
import {
  isCatalogPublication,
  latestCatalogs,
  readCatalogs,
  type SystemRoleCatalog,
} from "../src/features/access/system-role-catalogs/catalogs";
const fixtures: SystemRoleCatalog[] = [
  {
    productCode: "billing",
    name: "Billing",
    version: 1,
    contractVersion: 1,
    publicationStatus: "pending",
    roles: [
      {
        code: "billing.integration_operator",
        name: "Operación de integraciones",
        allowedScopes: [
          { resource: "organizations", consumer: "not_applicable" },
        ],
      },
    ],
  },
  {
    productCode: "legal",
    name: "Legal",
    version: 2,
    contractVersion: 1,
    publicationStatus: "pending",
    roles: [
      {
        code: "legal.integration_manager",
        name: "Administración de integraciones",
        allowedScopes: [
          { resource: "applications", consumer: "not_applicable" },
        ],
      },
    ],
  },
];
describe("Persisted catalog state", () => {
  test("shows no publication action before loading the authoritative status", () => {
    const html = renderToStaticMarkup(<CatalogsClient />);
    expect(html).toContain("Consultando el estado de publicación");
    expect(html).not.toContain("Publicar Legal");
  });
  test("shows independent actions only for pending versions", () => {
    const billing = renderToStaticMarkup(
      <CatalogPublication catalog={fixtures[0]} />,
    );
    const legal = renderToStaticMarkup(
      <CatalogPublication catalog={fixtures[1]} />,
    );
    expect(billing).toContain("Publicar Billing v1");
    expect(billing).not.toContain("legal.integration_manager");
    expect(legal).toContain("Publicar Legal v2");
    expect(legal).toContain("legal.integration_manager");
  });
  test.each(["published", "conflict", "unavailable"] as const)(
    "does not offer publication after loading %s from Access",
    (publicationStatus) => {
      const html = renderToStaticMarkup(
        <CatalogPublication catalog={{ ...fixtures[1], publicationStatus }} />,
      );
      expect(html).not.toContain("Publicar Legal v2");
      expect(html).toContain(
        publicationStatus === "published"
          ? "Publicado"
          : publicationStatus === "conflict"
            ? "Requiere revisión"
            : "Sistema no habilitado",
      );
    },
  );
  test("loads newer versions from Access without adding frontend definitions", () => {
    const catalogs = readCatalogs([
      ...fixtures,
      { ...fixtures[1], version: 3 },
    ]);
    expect(
      latestCatalogs(catalogs).map((c) => [c.productCode, c.version]),
    ).toEqual([
      ["billing", 1],
      ["legal", 3],
    ]);
    expect(() => readCatalogs([...fixtures, fixtures[0]])).toThrow("Duplicate");
    expect(() =>
      readCatalogs([{ ...fixtures[0], publicationStatus: "invented" }]),
    ).toThrow("Invalid");
  });
  test("validates exact publication identity and rejects duplicate evidence", () => {
    for (const catalog of fixtures) {
      const result = {
        catalogVersion: catalog.version,
        replayed: true,
        roles: catalog.roles.map((r, n) => ({ id: "id-" + n, code: r.code })),
      };
      expect(isCatalogPublication(result, catalog)).toBe(true);
      expect(
        isCatalogPublication({ ...result, catalogVersion: 99 }, catalog),
      ).toBe(false);
      expect(
        isCatalogPublication(
          { ...result, roles: [{ id: "id", code: "other.viewer" }] },
          catalog,
        ),
      ).toBe(false);
      expect(
        isCatalogPublication({ ...result, replayed: "true" }, catalog),
      ).toBe(false);
    }
  });
});
