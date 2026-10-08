import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  AccessOrganization,
  AccessProduct,
  CreateOrganizationPayload,
  EnableOrganizationProductPayload,
  OrganizationFilters,
  OrganizationProduct,
  UpdateOrganizationPayload,
} from "./types";

const ORGANIZATIONS_PATH = "/access/organizations";

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
  ) as T;
}

function readOrganizations(payload: unknown): AccessOrganization[] {
  if (Array.isArray(payload)) return payload as AccessOrganization[];

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["organizations", "data", "items"]) {
      if (Array.isArray(record[key])) return record[key] as AccessOrganization[];
    }
  }

  return [];
}

function readList<T>(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  return [];
}

export async function listOrganizations(
  filters: OrganizationFilters = {},
  options: ConsoleApiRequestOptions = {}
) {
  const payload = await consoleApi.get<unknown>(ORGANIZATIONS_PATH, {
    ...options,
    query: filters,
  });

  return readOrganizations(payload);
}

export function getOrganization(
  organizationId: string,
  options: ConsoleApiRequestOptions = {}
) {
  return consoleApi.get<AccessOrganization>(
    `${ORGANIZATIONS_PATH}/${organizationId}`,
    options
  );
}

export function createOrganization(payload: CreateOrganizationPayload) {
  return consoleApi.post<AccessOrganization>(
    ORGANIZATIONS_PATH,
    compactPayload(payload)
  );
}

export function updateOrganization(
  organizationId: string,
  payload: UpdateOrganizationPayload
) {
  return consoleApi.patch<AccessOrganization>(
    `${ORGANIZATIONS_PATH}/${organizationId}`,
    compactPayload(payload)
  );
}

export type OrganizationStatusAction = "activate" | "archive" | "suspend";

export function changeOrganizationStatus(
  organizationId: string,
  action: OrganizationStatusAction
) {
  return consoleApi.post<AccessOrganization>(
    `${ORGANIZATIONS_PATH}/${organizationId}/${action}`
  );
}

const PRODUCTS_PATH = "/access/products";

export async function listProducts(options: ConsoleApiRequestOptions = {}) {
  return readList<AccessProduct>(
    await consoleApi.get<unknown>(PRODUCTS_PATH, options),
    ["products", "items", "data"]
  );
}

export async function listOrganizationProducts(
  organizationId: string,
  options: ConsoleApiRequestOptions = {}
) {
  return readList<OrganizationProduct>(
    await consoleApi.get<unknown>(
      `${ORGANIZATIONS_PATH}/${organizationId}/products`,
      options
    ),
    ["organizationProducts", "products", "items", "data"]
  );
}

export function enableOrganizationProduct(
  organizationId: string,
  productCode: string,
  payload: EnableOrganizationProductPayload
) {
  return consoleApi.post<OrganizationProduct>(
    `${ORGANIZATIONS_PATH}/${organizationId}/products/${productCode}/enable`,
    payload
  );
}

export type OrganizationProductStatusAction =
  | "activate"
  | "disable"
  | "suspend";

export function changeOrganizationProductStatus(
  organizationId: string,
  productCode: string,
  action: OrganizationProductStatusAction
) {
  return consoleApi.post<OrganizationProduct>(
    `${ORGANIZATIONS_PATH}/${organizationId}/products/${productCode}/${action}`
  );
}
