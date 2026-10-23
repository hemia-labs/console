export type Destination = {
  resource: string;
  audience: string;
  scopes: string[];
};
export type SystemService = {
  code: string;
  name: string;
  url: string;
  audience: string;
  resource: string;
  enabled: boolean;
};
export type SystemBinding = {
  oauthIssuer: string;
  clientId: string;
  capabilityCode: string;
  roles: string[];
  enabled: boolean;
};
export type SystemDraft = {
  code: string;
  name: string;
  enabled: boolean;
  services: SystemService[];
  clients: SystemBinding[];
  configuration: Record<string, Record<string, unknown>>;
};
export type SystemRecord = SystemDraft & { id: string };
export type IdentityClient = {
  id: string;
  clientId: string;
  audience: string;
  status: string;
  type: string;
  grantTypes: string[];
  serviceDestinations: Destination[] | null;
};
export type Scope = {
  code: string;
  audience: string;
  resource: string | null;
  enabled: boolean;
};
export type Capability = {
  code: string;
  name?: string;
  schema?: {
    fields: { key: string; functions?: string[]; required?: boolean }[];
  };
  functions: { code: string; scopes: { code: string; audience: string }[] }[];
};
