"use client";

import Link from "next/link";
import { AlertCircle, ChevronDown, Save, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/zuno/button";
import { Badge } from "@/components/zuno/badge";
import { Card, CardFooter } from "@/components/zuno/card";
import { Switch } from "@/components/zuno/switch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/zuno/dropdown-menu";
import { Input } from "@/components/zuno/input";
import { Label } from "@/components/zuno/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/zuno/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateOAuthClientPayload,
  IdentityOAuthClient,
  OAuthClientStatus,
  OAuthClientType,
  OAuthServiceDestination,
  UpdateOAuthClientPayload,
} from "./types";
import { addOAuthScope, formatLines, parseLines } from "./oauth-client-utils";

const grantTypeOptions = [
  {
    description: "Código de autorización",
    label: "authorization_code",
    value: "authorization_code",
  },
  {
    description: "Credenciales de cliente",
    label: "client_credentials",
    value: "client_credentials",
  },
  {
    description: "Renovación de tokens",
    label: "refresh_token",
    value: "refresh_token",
  },
  {
    description: "Intercambio de tokens",
    label: "urn:ietf:params:oauth:grant-type:token-exchange",
    value: "urn:ietf:params:oauth:grant-type:token-exchange",
  },
] as const;

const responseTypeOptions = [
  { description: "Código de autorización", label: "code", value: "code" },
] as const;

const scopeOptions = [
  { description: "OpenID Connect", label: "openid", value: "openid" },
  { description: "Datos básicos del perfil", label: "profile", value: "profile" },
  { description: "Correo electrónico", label: "email", value: "email" },
  { description: "Acceso sin conexión", label: "offline_access", value: "offline_access" },
] as const;

const statusOptions: { label: string; value: OAuthClientStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Eliminado", value: "deleted" },
];

const typeOptions: { label: string; value: OAuthClientType }[] = [
  { label: "Confidencial", value: "confidential" },
  { label: "Público", value: "public" },
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
      {help ? <p className="text-xs leading-5 text-muted-foreground" id={`${htmlFor}-help`}>{help}</p> : null}
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
  disabled,
  removable,
}: {
  disabled?: boolean;
  removable?: boolean;
  id: string;
  label: string;
  onChange: (value: string[]) => void;
  options: readonly MultiSelectOption[];
  placeholder: string;
  value: string[];
}) {
  const [configuredValues] = useState(value);
  const customValues = [...new Set([...configuredValues, ...value])]
    .filter((item) => !options.some((option) => option.value === item));
  function toggleValue(nextValue: string, checked: boolean) {
    if (checked) {
      onChange([...new Set([...value, nextValue])]);
      return;
    }

    onChange(value.filter((item) => item !== nextValue));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button className="h-auto min-h-10 w-full whitespace-normal bg-card px-3 py-2 text-left font-normal [&>span]:w-full [&>span]:gap-3" variant="outline" />}
          disabled={disabled}
          aria-describedby={`${id}-help`}
          id={id}
          type="button"
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {value.length ? (
              removable ? <span>{value.length} seleccionados</span> : value.map((item) => (
                <Badge key={item} title={item} className="max-w-full truncate font-mono text-xs" variant="secondary">
                  {item}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-80 w-96 max-w-[calc(100vw-2rem)] overflow-y-auto" sideOffset={6}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[...options, ...customValues.map((item) => ({ value: item, label: item, description: "Valor configurado" }))].map((option) => (
              <DropdownMenuCheckboxItem
                className="min-h-10"
                checked={value.includes(option.value)}
                disabled={disabled}
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
      {removable && value.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Permisos seleccionados">
          {value.map((scope) => (
            <Badge key={scope} variant="secondary" className="max-w-full gap-1 pl-2 pr-0">
              <span className="min-w-0 break-all font-mono text-xs">{scope}</span>
              <Button type="button" variant="ghost" size="icon" disabled={disabled} className="size-8 shrink-0" aria-label={`Quitar permiso ${scope}`} onClick={() => onChange(value.filter((item) => item !== scope))}>
                <X className="size-3" aria-hidden="true" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );
}

export type OAuthClientFormState = {
  destinationMode: boolean;
  serviceDestinations: OAuthServiceDestination[];
  hadServiceDestinations: boolean;
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

export function initialState(client?: IdentityOAuthClient): OAuthClientFormState {
  return {
    destinationMode: Boolean(client?.serviceDestinations?.length),
    hadServiceDestinations: Boolean(client?.serviceDestinations?.length),
    serviceDestinations: (client?.serviceDestinations ?? []).map(d => ({ ...d, scopes: [...d.scopes] })),
    audience: client?.audience ? String(client.audience) : "",
    clientId: client?.clientId ? String(client.clientId) : "",
    grantTypes: client ? (client.grantTypes ?? []).map(String) : ["authorization_code", "client_credentials", "refresh_token"],
    redirectUris: formatLines(client?.redirectUris),
    requiresConsent: Boolean(client?.requiresConsent),
    responseTypes: client ? (client.responseTypes ?? []).map(String) : ["code"],
    scopes: client ? (client.scopes ?? []).map(String) : ["openid", "profile", "email", "offline_access"],
    status: (client?.status as OAuthClientStatus | undefined) ?? "active",
    type: (client?.type as OAuthClientType | undefined) ?? "confidential",
  };
}

export function buildPayload(form: OAuthClientFormState): CreateOAuthClientPayload {
  return {
    ...(form.destinationMode ? { serviceDestinations: form.serviceDestinations.map(d => ({ resource: d.resource.trim(), audience: d.audience.trim(), scopes: [...new Set(d.scopes.map(scope => scope.trim()).filter(Boolean))] })) } : form.hadServiceDestinations ? { serviceDestinations: null } : {}),
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

export function validateDestinationForm(form: OAuthClientFormState): string | null {
  if (!form.destinationMode) return null;
  if (form.type !== "confidential" || !form.grantTypes.includes("client_credentials")) return "Los permisos por destino requieren un cliente confidencial y el flujo client_credentials.";
  if (!form.serviceDestinations.length || form.serviceDestinations.length > 32) return "Agrega entre 1 y 32 destinos.";
  const resources = new Set<string>();
  const audiences = new Set<string>();
  for (const destination of form.serviceDestinations) {
    const resource = destination.resource.trim();
    const audience = destination.audience.trim();
    try { const url = new URL(resource); if (!["http:", "https:"].includes(url.protocol) || url.hash || resource.length > 2048) return "Cada destino debe ser una URL HTTP o HTTPS sin fragmento."; } catch { return "Revisa la URL de cada destino."; }
    if (!audience || audience.length > 160) return "Cada destino necesita una audiencia de hasta 160 caracteres.";
    if (resources.has(resource) || audiences.has(audience)) return "No repitas URLs ni audiencias entre destinos.";
    resources.add(resource); audiences.add(audience);
    const scopes = destination.scopes.map(scope => scope.trim()).filter(Boolean);
    if (!scopes.length || scopes.length > 100 || scopes.some(scope => scope.length > 160 || !/^[\x21\x23-\x5B\x5D-\x7E]+$/.test(scope))) return "Cada destino necesita entre 1 y 100 scopes válidos, sin espacios.";
  }
  return null;
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

  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [destinationScopeDrafts, setDestinationScopeDrafts] = useState<string[]>([]);
  const [destinationScopeErrors, setDestinationScopeErrors] = useState<(string | null)[]>([]);
  const [scopeDraft, setScopeDraft] = useState("");
  const [scopeError, setScopeError] = useState<string | null>(null);

  function addScope() {
    const result = addOAuthScope(form.scopes, scopeDraft);
    setScopeError(result.error);
    if (result.error) return null;
    update("scopes", result.scopes);
    setScopeDraft("");
    return result.scopes;
  }

  function addDestinationScope(index: number) {
    const result = addOAuthScope(form.serviceDestinations[index].scopes, destinationScopeDrafts[index] ?? "");
    setDestinationScopeErrors(current => { const next = [...current]; next[index] = result.error; return next; });
    if (result.error) return;
    update("serviceDestinations", form.serviceDestinations.map((destination, i) => i === index ? { ...destination, scopes: result.scopes } : destination));
    setDestinationScopeDrafts(current => { const next = [...current]; next[index] = ""; return next; });
  }

  function update<K extends keyof OAuthClientFormState>(key: K, value: OAuthClientFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const destinations = form.serviceDestinations.map(destination => ({ ...destination, scopes: [...destination.scopes] }));
    if (form.destinationMode) {
      for (let index = 0; index < destinations.length; index++) {
        const draft = destinationScopeDrafts[index];
        if (!draft) continue;
        const result = addOAuthScope(destinations[index].scopes, draft);
        if (result.error) { setDestinationScopeErrors(current => { const next = [...current]; next[index] = result.error; return next; }); return; }
        destinations[index].scopes = result.scopes;
      }
    }
    const nextForm = { ...form, serviceDestinations: destinations };
    const destinationError = validateDestinationForm(nextForm);
    setDestinationError(destinationError);
    if (destinationError) return;
    const scopes = scopeDraft ? addScope() : form.scopes;
    if (!scopes) return;
    await onSubmit(buildPayload({ ...nextForm, scopes }));
  }

  return (
    <Card className="overflow-hidden rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} aria-busy={pending || undefined}>
        <fieldset disabled={pending} className="min-w-0 divide-y divide-border">
          <section className="grid gap-5 p-5 lg:grid-cols-[15rem_minmax(0,1fr)]" aria-labelledby="client-general-heading">
            <div>
              <h2 className="text-base font-semibold" id="client-general-heading">Información general</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Identifica la aplicación y define su tipo y estado.</p>
            </div>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              <FormField htmlFor="clientId" label="ID del cliente *" help="Identificador que la aplicación envía como client_id en OAuth.">
                <Input className="h-10 bg-card" id="clientId" aria-describedby="clientId-help" onChange={(event) => update("clientId", event.target.value)} required value={form.clientId} />
              </FormField>
              <FormField htmlFor="audience" label={form.destinationMode ? "Audiencia base *" : "Audience *"} help={form.destinationMode ? "Se conserva para otros flujos OAuth. Cada token de servicio usa la audiencia de su destino." : "Identificador del recurso al que tendrá acceso la aplicación."}>
                <Input className="h-10 bg-card" id="audience" aria-describedby="audience-help" onChange={(event) => update("audience", event.target.value)} required value={form.audience} />
              </FormField>
              <FormField htmlFor="type" label="Tipo" help="Confidencial: usa un secreto. Público: no almacena un secreto.">
                <Select disabled={pending} items={typeOptions} onValueChange={(value) => { if (value) update("type", value as OAuthClientType); }} value={form.type}>
                  <SelectTrigger className="h-10 w-full bg-card" id="type" aria-describedby="type-help"><SelectValue /></SelectTrigger>
                  <SelectContent>{typeOptions.map((option) => <SelectItem className="min-h-10" key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField htmlFor="status" label="Estado" help="Controla si la aplicación puede iniciar flujos OAuth.">
                <Select disabled={pending} items={statusOptions} onValueChange={(value) => { if (value) update("status", value as OAuthClientStatus); }} value={form.status}>
                  <SelectTrigger className="h-10 w-full bg-card" id="status" aria-describedby="status-help"><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map((option) => <SelectItem className="min-h-10" key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <p className="text-xs text-muted-foreground sm:col-span-2">* Campos obligatorios</p>
            </div>
          </section>

          <section className="grid gap-5 p-5 lg:grid-cols-[15rem_minmax(0,1fr)]" aria-labelledby="client-oauth-heading">
            <div>
              <h2 className="text-base font-semibold" id="client-oauth-heading">Configuración OAuth</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Define las redirecciones, los flujos y los permisos de la aplicación.</p>
            </div>
            <div className="min-w-0 space-y-5">
              <FormField htmlFor="redirectUris" label="URLs de redirección" help="Una URL por línea. También puedes separarlas por comas.">
                <Textarea className="min-h-28 bg-card font-mono text-sm" id="redirectUris" aria-describedby="redirectUris-help" onChange={(event) => update("redirectUris", event.target.value)} placeholder="https://app.hemia.cloud/callback" rows={3} value={form.redirectUris} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField htmlFor="grantTypes" label="Flujos permitidos" help="Grant types que podrá utilizar la aplicación.">
                  <OAuthMultiSelect disabled={pending} id="grantTypes" label="Flujos permitidos" onChange={(value) => update("grantTypes", value)} options={grantTypeOptions} placeholder="Selecciona los flujos" value={form.grantTypes} />
                </FormField>
                <FormField htmlFor="responseTypes" label="Tipos de respuesta" help="Response types permitidos en las solicitudes OAuth.">
                  <OAuthMultiSelect disabled={pending} id="responseTypes" label="Tipos de respuesta" onChange={(value) => update("responseTypes", value)} options={responseTypeOptions} placeholder="Selecciona los tipos de respuesta" value={form.responseTypes} />
                </FormField>
              </div>
              <FormField htmlFor="scopes" label={form.destinationMode ? "Scopes generales (otros flujos OAuth)" : "Permisos (scopes)"} help={form.destinationMode ? "Estos scopes no se usan para autorizar client_credentials. Configura los permisos del servicio en cada destino." : "Selecciona permisos sugeridos o agrega un scope personalizado, sin espacios."}>
                <OAuthMultiSelect removable disabled={pending} id="scopes" label="Permisos (scopes)" onChange={(value) => update("scopes", value)} options={scopeOptions} placeholder="Selecciona los permisos" value={form.scopes} />
                <Label className="sr-only" htmlFor="customScope">Nuevo scope</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="h-10 min-w-0 bg-card font-mono text-sm"
                    id="customScope"
                    placeholder="billing.integration.checkout.create"
                    value={scopeDraft}
                    aria-invalid={Boolean(scopeError)}
                    aria-describedby={scopeError ? "scopes-help customScope-error" : "scopes-help"}
                    onChange={(event) => { setScopeDraft(event.target.value); setScopeError(null); }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        addScope();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" disabled={pending} className="h-10 shrink-0" onClick={addScope}>Agregar</Button>
                </div>
                {scopeError ? <p id="customScope-error" role="alert" className="text-sm text-destructive">{scopeError}</p> : null}
              </FormField>
            </div>
          </section>

          <section className="grid gap-5 p-5 lg:grid-cols-[15rem_minmax(0,1fr)]" aria-labelledby="client-destinations-heading">
            <div><h2 className="text-base font-semibold" id="client-destinations-heading">Permisos por destino</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Para clientes confidenciales con client_credentials. Los scopes generales no autorizan tokens de servicio cuando este modelo está habilitado.</p></div>
            <div className="min-w-0 space-y-5">
              <label className="flex min-h-10 items-center gap-3 text-sm"><input type="checkbox" checked={form.destinationMode} onChange={e => { update("destinationMode", e.target.checked); setDestinationError(null); }} />Usar permisos por destino</label>
              {!form.destinationMode && form.hadServiceDestinations ? <p role="alert" className="text-sm text-destructive">Al guardar se eliminarán los permisos por destino y se usarán la audiencia y los scopes generales.</p> : null}
              {form.destinationMode ? <>
                {form.serviceDestinations.map((destination, index) => {
                  const change = (value: Partial<OAuthServiceDestination>) => update("serviceDestinations", form.serviceDestinations.map((item, i) => i === index ? { ...item, ...value } : item));
                  return <div className="space-y-4 rounded-lg border border-border p-4" key={index}>
                    <h3 className="text-sm font-semibold">Destino {index + 1}</h3>
                    <FormField htmlFor={`resource-${index}`} label="URL del destino (resource) *" help="URL HTTP o HTTPS exacta que el servicio solicita a Identity."><Input className="h-10 bg-card" id={`resource-${index}`} aria-describedby={`resource-${index}-help`} type="url" maxLength={2048} required value={destination.resource} onChange={e => change({ resource: e.target.value })} /></FormField>
                    <FormField htmlFor={`destination-audience-${index}`} label="Audiencia *"><Input className="h-10 bg-card" id={`destination-audience-${index}`} maxLength={160} required value={destination.audience} onChange={e => change({ audience: e.target.value })} /></FormField>
                    <FormField htmlFor={`destination-scopes-${index}`} label="Scopes permitidos *" help="Selecciona permisos o agrega un scope personalizado. Solo corresponden a este destino.">
                      <OAuthMultiSelect removable disabled={pending} id={`destination-scopes-${index}`} label={`Scopes del destino ${index + 1}`} onChange={scopes => change({ scopes })} options={scopeOptions} placeholder="Selecciona los permisos" value={destination.scopes} />
                      <Label className="sr-only" htmlFor={`destination-custom-scope-${index}`}>Nuevo scope del destino {index + 1}</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input className="h-10 min-w-0 bg-card font-mono text-sm" id={`destination-custom-scope-${index}`} maxLength={160} placeholder="legal.consumer_context.read" value={destinationScopeDrafts[index] ?? ""} aria-invalid={Boolean(destinationScopeErrors[index])} aria-describedby={destinationScopeErrors[index] ? `destination-scopes-${index}-help destination-scope-error-${index}` : `destination-scopes-${index}-help`} onChange={e => { const value = e.target.value; setDestinationScopeDrafts(current => { const next = [...current]; next[index] = value; return next; }); setDestinationScopeErrors(current => { const next = [...current]; next[index] = null; return next; }); }} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addDestinationScope(index); } }} />
                        <Button type="button" variant="outline" disabled={pending} className="h-10 shrink-0" onClick={() => addDestinationScope(index)}>Agregar</Button>
                      </div>
                      {destinationScopeErrors[index] ? <p id={`destination-scope-error-${index}`} role="alert" className="text-sm text-destructive">{destinationScopeErrors[index]}</p> : null}
                    </FormField>
                    <Button type="button" variant="outline" className="h-10" onClick={() => { update("serviceDestinations", form.serviceDestinations.filter((_, i) => i !== index)); setDestinationScopeDrafts(current => current.filter((_, i) => i !== index)); setDestinationScopeErrors(current => current.filter((_, i) => i !== index)); }}>Quitar destino {index + 1}</Button>
                  </div>;
                })}
                <Button type="button" variant="outline" className="h-10" disabled={pending || form.serviceDestinations.length >= 32} onClick={() => update("serviceDestinations", [...form.serviceDestinations, { resource: "", audience: "", scopes: [] }])}>Agregar destino</Button>
              </> : null}
              {destinationError ? <p role="alert" className="text-sm text-destructive">{destinationError}</p> : null}
            </div>
          </section>

          <section className="grid gap-5 p-5 lg:grid-cols-[15rem_minmax(0,1fr)]" aria-labelledby="client-consent-heading">
            <div>
              <h2 className="text-base font-semibold" id="client-consent-heading">Consentimiento</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Define si el usuario debe aprobar los permisos solicitados.</p>
            </div>
            <div className="flex min-h-10 items-start justify-between gap-4">
              <div>
                <Label id="requiresConsent-label" htmlFor="requiresConsent">Solicitar consentimiento</Label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground" id="requiresConsent-help">Muestra la solicitud de consentimiento al autorizar esta aplicación.</p>
              </div>
              <div className="flex h-10 shrink-0 items-center">
                <Switch disabled={pending} id="requiresConsent" aria-labelledby="requiresConsent-label" aria-describedby="requiresConsent-help" checked={form.requiresConsent} onCheckedChange={(checked) => update("requiresConsent", checked)} />
              </div>
            </div>
          </section>
        </fieldset>

        {error ? (
          <div role="alert" className="mx-5 mb-5 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /><p>{error}</p>
          </div>
        ) : null}

        <CardFooter className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">{mode === "edit" ? "Los cambios se aplican al guardar." : "El secreto se mostrará una sola vez al crear el cliente."}</p>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button className="h-10 w-full px-4 sm:w-auto" disabled={pending} variant="outline" render={<Link href={cancelHref} />}>Cancelar</Button>
            <Button className="h-10 w-full px-4 sm:w-auto" disabled={pending} loading={pending} type="submit">
              <Save className="size-4" />{mode === "edit" ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
