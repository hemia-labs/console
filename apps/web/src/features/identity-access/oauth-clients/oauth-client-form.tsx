"use client";

import Link from "next/link";
import { AlertCircle, ChevronDown, Save, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateOAuthClientPayload,
  IdentityOAuthClient,
  OAuthClientStatus,
  OAuthClientType,
  UpdateOAuthClientPayload,
} from "./types";
import { formatLines, parseLines } from "./oauth-client-utils";

const grantTypeOptions = [
  {
    description: "Authorization Code",
    label: "authorization_code",
    value: "authorization_code",
  },
  {
    description: "Client Credentials",
    label: "client_credentials",
    value: "client_credentials",
  },
  {
    description: "Refresh Token",
    label: "refresh_token",
    value: "refresh_token",
  },
  {
    description: "Device Code",
    label: "urn:ietf:params:oauth:grant-type:device_code",
    value: "urn:ietf:params:oauth:grant-type:device_code",
  },
  {
    description: "JWT Bearer",
    label: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    value: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  },
  {
    description: "SAML 2.0 Bearer",
    label: "urn:ietf:params:oauth:grant-type:saml2-bearer",
    value: "urn:ietf:params:oauth:grant-type:saml2-bearer",
  },
  {
    description: "Token Exchange",
    label: "urn:ietf:params:oauth:grant-type:token-exchange",
    value: "urn:ietf:params:oauth:grant-type:token-exchange",
  },
  {
    description: "CIBA",
    label: "urn:openid:params:grant-type:ciba",
    value: "urn:openid:params:grant-type:ciba",
  },
  {
    description: "Password",
    label: "password",
    value: "password",
  },
] as const;

const responseTypeOptions = [
  { description: "Authorization code", label: "code", value: "code" },
  { description: "Implicit access token", label: "token", value: "token" },
  { description: "OpenID Connect ID token", label: "id_token", value: "id_token" },
  { description: "No response", label: "none", value: "none" },
  { description: "Hybrid: code + token", label: "code token", value: "code token" },
  { description: "Hybrid: code + ID token", label: "code id_token", value: "code id_token" },
  { description: "Hybrid: token + ID token", label: "token id_token", value: "token id_token" },
  {
    description: "Hybrid: code + token + ID token",
    label: "code token id_token",
    value: "code token id_token",
  },
] as const;

const scopeOptions = [
  { description: "OpenID Connect", label: "openid", value: "openid" },
  { description: "Basic profile claims", label: "profile", value: "profile" },
  { description: "Email claims", label: "email", value: "email" },
  { description: "Refresh token scope", label: "offline_access", value: "offline_access" },
  { description: "Address claims", label: "address", value: "address" },
  { description: "Phone claims", label: "phone", value: "phone" },
  { description: "External events read", label: "events:read", value: "events:read" },
  { description: "External users read", label: "users:read", value: "users:read" },
] as const;

const statusOptions: { label: string; value: OAuthClientStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Eliminado", value: "deleted" },
];

const typeOptions: { label: string; value: OAuthClientType }[] = [
  { label: "Confidential", value: "confidential" },
  { label: "Public", value: "public" },
];

function FormField({
  children,
  className,
  help,
  htmlFor,
  label,
}: {
  children: ReactNode;
  className?: string;
  help?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label className="text-sm font-semibold" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {help ? <p className="text-xs leading-5 text-supporting">{help}</p> : null}
    </div>
  );
}

type MultiSelectOption = {
  description: string;
  label: string;
  value: string;
};

function OAuthMultiSelect({
  id,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string[]) => void;
  options: readonly MultiSelectOption[];
  placeholder: string;
  value: string[];
}) {
  function toggleValue(nextValue: string, checked: boolean) {
    if (checked) {
      onChange([...new Set([...value, nextValue])]);
      return;
    }

    onChange(value.filter((item) => item !== nextValue));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "min-h-12 w-full justify-between gap-3 whitespace-normal bg-card px-3 py-2 text-left font-normal"
        )}
        id={id}
        type="button"
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {value.length ? (
            value.map((item) => (
              <Badge key={item} className="max-w-full truncate" variant="secondary">
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-w-[calc(100vw-2rem)]" sideOffset={6}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              checked={value.includes(option.value)}
              key={option.value}
              onCheckedChange={(checked) => toggleValue(option.value, checked)}
            >
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate font-medium">{option.description}</span>
                <span className="truncate text-xs text-muted-foreground">{option.label}</span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type OAuthClientFormState = {
  audience: string;
  clientId: string;
  grantTypes: string[];
  redirectUris: string;
  requiresConsent: boolean;
  responseTypes: string[];
  scopes: string[];
  status: OAuthClientStatus;
  type: OAuthClientType;
};

function initialState(client?: IdentityOAuthClient): OAuthClientFormState {
  return {
    audience: client?.audience ? String(client.audience) : "",
    clientId: client?.clientId ? String(client.clientId) : "",
    grantTypes: client?.grantTypes?.length
      ? client.grantTypes.map(String)
      : ["authorization_code", "client_credentials", "refresh_token"],
    redirectUris: formatLines(client?.redirectUris),
    requiresConsent: Boolean(client?.requiresConsent),
    responseTypes: client?.responseTypes?.length ? client.responseTypes.map(String) : ["code"],
    scopes: client?.scopes?.length
      ? client.scopes.map(String)
      : ["openid", "profile", "email", "offline_access"],
    status: (client?.status as OAuthClientStatus | undefined) ?? "active",
    type: (client?.type as OAuthClientType | undefined) ?? "confidential",
  };
}

function buildPayload(form: OAuthClientFormState) {
  return {
    audience: form.audience.trim(),
    clientId: form.clientId.trim(),
    grantTypes: form.grantTypes,
    redirectUris: parseLines(form.redirectUris),
    requiresConsent: form.requiresConsent,
    responseTypes: form.responseTypes,
    scopes: form.scopes,
    status: form.status,
    type: form.type,
  };
}

export function OAuthClientForm({
  cancelHref,
  client,
  error,
  mode,
  onSubmit,
  pending,
}: {
  cancelHref: string;
  client?: IdentityOAuthClient;
  error?: string | null;
  mode: "create" | "edit";
  onSubmit: (payload: CreateOAuthClientPayload | UpdateOAuthClientPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [form, setForm] = useState<OAuthClientFormState>(() => initialState(client));

  function update<K extends keyof OAuthClientFormState>(key: K, value: OAuthClientFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(buildPayload(form));
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {mode === "edit" ? <CardTitle>Editar OAuth client</CardTitle> : null}
              <CardDescription>
                {mode === "create"
                  ? "Registra un cliente en Hemia ID. El secreto se mostrara una sola vez."
                  : "Actualiza configuracion administrativa. El secreto no se puede consultar desde Console."}
              </CardDescription>
            </div>
            <Badge className="shrink-0" variant={mode === "create" ? "secondary" : "outline"}>
              {mode === "create" ? "Nuevo" : "Edicion"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField htmlFor="clientId" label="Client ID">
              <Input
                aria-invalid={Boolean(error && !form.clientId)}
                className="h-12 bg-card"
                id="clientId"
                onChange={(event) => update("clientId", event.target.value)}
                required
                value={form.clientId}
              />
            </FormField>

            <FormField htmlFor="audience" label="Audience">
              <Input
                aria-invalid={Boolean(error && !form.audience)}
                className="h-12 bg-card"
                id="audience"
                onChange={(event) => update("audience", event.target.value)}
                required
                value={form.audience}
              />
            </FormField>

            <FormField htmlFor="type" label="Type">
              <Select
                onValueChange={(value) => update("type", value as OAuthClientType)}
                value={form.type}
              >
                <SelectTrigger className="h-12 w-full bg-card" id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField htmlFor="status" label="Estado">
              <Select
                onValueChange={(value) => update("status", value as OAuthClientStatus)}
                value={form.status}
              >
                <SelectTrigger className="h-12 w-full bg-card" id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4">
            <FormField
              help="Una URI por linea o separadas por coma."
              htmlFor="redirectUris"
              label="Redirect URIs"
            >
              <Textarea
                id="redirectUris"
                onChange={(event) => update("redirectUris", event.target.value)}
                placeholder="https://console.hemia.cloud/auth/callback"
                value={form.redirectUris}
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField htmlFor="grantTypes" label="Grant types">
                <OAuthMultiSelect
                  id="grantTypes"
                  label="OAuth 2.0 grant types"
                  onChange={(grantTypes) => update("grantTypes", grantTypes)}
                  options={grantTypeOptions}
                  placeholder="Selecciona grant types"
                  value={form.grantTypes}
                />
              </FormField>

              <FormField htmlFor="responseTypes" label="Response types">
                <OAuthMultiSelect
                  id="responseTypes"
                  label="OAuth 2.0 response types"
                  onChange={(responseTypes) => update("responseTypes", responseTypes)}
                  options={responseTypeOptions}
                  placeholder="Selecciona response types"
                  value={form.responseTypes}
                />
              </FormField>
            </div>

            <FormField htmlFor="scopes" label="Scopes">
              <OAuthMultiSelect
                id="scopes"
                label="OAuth scopes"
                onChange={(scopes) => update("scopes", scopes)}
                options={scopeOptions}
                placeholder="Selecciona scopes"
                value={form.scopes}
              />
            </FormField>
          </div>

          <Label
            className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold"
            htmlFor="requiresConsent"
          >
            <Checkbox
              checked={form.requiresConsent}
              id="requiresConsent"
              onCheckedChange={(checked) => update("requiresConsent", checked === true)}
            />
            Requiere consentimiento
          </Label>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "h-12 w-full gap-2 sm:w-auto")}
            href={cancelHref}
          >
            <X className="size-4" />
            Cancelar
          </Link>
          <Button className="h-12 w-full gap-2 sm:w-auto" disabled={pending} type="submit">
            <Save className="size-4" />
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
