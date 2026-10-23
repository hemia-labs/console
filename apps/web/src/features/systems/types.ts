import {
  type OAuthScope,
  type ScopeReference,
} from "@/features/oauth-scopes/types";
export type CapabilityField = {
  functions?: string[];
  key: string;
  label: string;
  type: "string" | "number" | "integer" | "boolean";
  required?: boolean;
  description?: string;
  format?: "text" | "uri" | "uuid" | "code" | "identity-issuer" | "service";
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
};
export const capabilityFieldTypes = [
  { value: "string", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "integer", label: "Entero" },
  { value: "boolean", label: "Sí / No" },
] as const;
export type CapabilityFunction = {
  code: string;
  name: string;
  scopes: ScopeReference[];
};
export type Capability = {
  functions?: CapabilityFunction[];
  code: string;
  name: string;
  schema: { fields: CapabilityField[] };
};
export type SystemClient = {
  oauthIssuer: string;
  clientId: string;
  capabilityCode: string;
  roles: string[];
  enabled: boolean;
};
export type SystemService = {
  code: string;
  name: string;
  url: string;
  enabled: boolean;
  audience: string;
  resource: string;
};
export type SystemDraft = {
  services: SystemService[];
  code: string;
  name: string;
  enabled: boolean;
  configuration: Record<string, Record<string, unknown>>;
  clients: SystemClient[];
};
export type System = SystemDraft & { id: string };
export type CatalogChoices = {
  oauthIssuer?: string;
  scopes: OAuthScope[];
  audiences: string[];
  verificationClientId: string;
  clients: {
    id?: string;
    oauthIssuer: string;
    clientId: string;
    name: string;
    scopes: string[];
    audience?: string;
    serviceDestinations?:
      { resource: string; audience: string; scopes: string[] }[] | null;
  }[];
};
export const catalogPath = "/legal/system-catalog";
export function readConfiguration(text: string): SystemDraft["configuration"] {
  const value: unknown = JSON.parse(text);
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.values(value).some(
      (v) => !v || typeof v !== "object" || Array.isArray(v),
    )
  )
    throw new Error(
      "La configuración debe ser un objeto JSON con un objeto por capacidad.",
    );
  return value as SystemDraft["configuration"];
}
export function readSchema(text: string): Capability["schema"] {
  const value: unknown = JSON.parse(text);
  if (
    !value ||
    typeof value !== "object" ||
    !("fields" in value) ||
    !Array.isArray(value.fields) ||
    value.fields.length > 50 ||
    value.fields.some(
      (f) =>
        !f ||
        typeof f !== "object" ||
        typeof f.key !== "string" ||
        typeof f.label !== "string" ||
        !["string", "number", "integer", "boolean"].includes(f.type) ||
        (f.functions !== undefined &&
          (!Array.isArray(f.functions) ||
            !f.functions.length ||
            f.functions.some(
              (code: unknown) => typeof code !== "string" || !code,
            ))) ||
        (f.options !== undefined &&
          (!Array.isArray(f.options) ||
            f.options.some((o: unknown) => typeof o !== "string"))),
    )
  )
    throw new Error("Define hasta 50 campos válidos en fields.");
  return value as Capability["schema"];
}
export function verificationResource(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
      ? url.origin
      : "";
  } catch {
    return "";
  }
}
