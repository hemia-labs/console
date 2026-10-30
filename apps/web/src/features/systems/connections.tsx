"use client";
import { useCallback, useRef, useState, type ReactNode, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, PlugZap } from "lucide-react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { consoleApi } from "@/lib/console-api";
import { localizedHref } from "@/lib/nav";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { Input } from "@/components/zuno/input";
import { OneTimeSecretPanel } from "@/features/identity-access/oauth-clients/one-time-secret-panel";
import type { OneTimeOAuthSecret } from "@/features/identity-access/oauth-clients/types";
import { createCapabilityClient, saveSystem } from "./systems-api";
import {
  Choice,
  ConfigurationField,
  Field,
} from "./catalog-fields";
import { catalogPath } from "./types";
import { connectionServices, ConnectionServicesInfo, ConnectionPermissions } from "./connection-permissions";
import { RecoveredConfiguration } from "./recovered-configuration";
import { ConnectionReview, connectionReviewIssues } from "./connection-review";
import { ConnectionDeliveryResult } from "./connection-delivery";
import type { ConnectionResult } from "./connection-delivery-model";
export { ConnectionConfigurationOutput } from "./connection-delivery";
export type { ConnectionResult } from "./connection-delivery-model";
import {
  connectionPayload,
  clientCreationSelection,
  initialDraft,
  needs,
  presetSelection,
  reusableClients,
  schemaFields,
  selectFunction,
  suggestedSystemCode,
  type ConnectionDraft,
  type ConnectionOptions,
  type LegalOptions,
  type PaymentsOptions,
} from "./connections-model";
const load = (signal: AbortSignal) =>
  consoleApi.get<ConnectionOptions>(`${catalogPath}/connections/options`, {
    signal,
  });
export const connectionStatus = {
  configured: "Configuración guardada",
  verified: "Conexión comprobada",
  pending: "Conexión pendiente",
};

type FormProps = {
  options: ConnectionOptions;
  preset?: string;
  systemsHref: string;
};
export function ConnectionForm({ options: initialOptions, preset, systemsHref }: FormProps) {
  const [options, setOptions] = useState(initialOptions);
  const [newSystem, setNewSystem] = useState(!initialOptions.systems.some((s) => s.enabled));
  const [systemName, setSystemName] = useState("");
  const [systemCode, setSystemCode] = useState("");
  const [newClient, setNewClient] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);
  const [details, setDetails] = useState<{ payments?: PaymentsOptions; legal?: LegalOptions }>({});
  const [value, setValue] = useState(() =>
    initialDraft(presetSelection(preset, options.capabilities)),
  );
  const [step, setStep] = useState(0),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const locked = useRef(false);
  const initializedDefaults = useRef(new Set<string>());
  const relevant = needs(value.selected);
  const system = options.systems.find((s) => s.id === value.systemId);
  const reused = reusableClients(system, options.choices);
  const selectedClient = options.choices.clients.find((c) => c.clientId === value.clientId);
  const reviewPending = connectionReviewIssues(value, options, details);
  function update(next: Partial<ConnectionDraft>) {
    setValue((v) => ({ ...v, ...next }));
    setResult(null);
    setError("");
  }
  const loadDetails = useCallback(
    async (signal: AbortSignal) => {
      const [payments, legal] = await Promise.all([
        relevant.payments
          ? consoleApi.get<PaymentsOptions>(
              `${catalogPath}/connections/options/payments`,
              { signal },
            )
          : Promise.resolve(undefined),
        relevant.legal
          ? consoleApi.get<LegalOptions>(
              `${catalogPath}/connections/options/legal`,
              { signal },
            )
          : Promise.resolve(undefined),
      ]);
      if (!signal.aborted) {
        setDetails({ payments, legal });
        const key = `${value.systemId}/${value.clientId}`;
        const policy = !newClient ? payments?.policies.find(
          (entry) => entry.clientId === value.clientId,
        ) : undefined;
        const integration = legal?.integrations.find(
          (entry) => entry.systemId === value.systemId,
        );
        const usePolicy = Boolean(
          policy && !initializedDefaults.current.has(`${key}/payments`),
        );
        const useLegal = Boolean(
          integration && !initializedDefaults.current.has(`${key}/legal`),
        );
        if (payments) initializedDefaults.current.add(`${key}/payments`);
        if (legal) initializedDefaults.current.add(`${key}/legal`);
        if (usePolicy || useLegal)
          setValue((current) =>
            current.systemId !== value.systemId ||
            current.clientId !== value.clientId
              ? current
              : {
                  ...current,
                  ...(usePolicy && policy
                    ? {
                        payments: {
                          ...current.payments,
                          productCode: current.payments.productCode || (policy.products?.length === 1 && payments?.products.some((p) => p.code === policy.products?.[0]) ? policy.products[0] : ""),
                          organizationScope: policy.organizationScope,
                          organizationIds: policy.organizationIds ?? [],
                        },
                      }
                    : {}),
                  ...(useLegal && integration
                    ? {
                        legal: {
                          applicationId: integration.applicationId,
                          documentIds: integration.documentIds,
                        },
                      }
                    : {}),
                },
          );
      }
      return { payments, legal };
    },
    [relevant.payments, relevant.legal, value.systemId, value.clientId, newClient],
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    if (step === 0) {
      setError("");
      if (newSystem || newClient) {
        const selection = clientCreationSelection(value.selected, options.capabilities);
        if (!Object.values(value.selected).some((f) => f.length)) {
          setError("Elige al menos una función para tu sistema.");
          return;
        }
        const clientId = newClientId.trim() || `${systemCode || system?.code}-backend`;
        if (newSystem && (!systemName.trim() || !/^[a-z][a-z0-9_-]{1,79}$/.test(systemCode))) {
          setError("Escribe el nombre y un código válido para el sistema.");
          return;
        }
        if (!newSystem && !system) {
          setError("Selecciona un sistema.");
          return;
        }
        if (!selection || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(clientId)) {
          setError(!selection ? "Las funciones seleccionadas necesitan permisos definidos para crear el cliente OAuth." : "Revisa el identificador del cliente OAuth.");
          return;
        }
        setStep(1);
        return;
      }
      if (
        !value.systemId ||
        !value.clientId ||
        !Object.values(value.selected).some((f) => f.length)
      ) {
        setError("Selecciona sistema, cliente y al menos una función.");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      setError("");
      return;
    }
    if (reviewPending.length) {
      setError(reviewPending[0]);
      return;
    }
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      let next = value;
      if (newSystem || newClient) {
        const selection = clientCreationSelection(value.selected, options.capabilities);
        if (!selection) throw new Error("Las funciones seleccionadas necesitan permisos definidos para preparar el acceso.");
        const clientId = newClientId.trim() || `${systemCode || system?.code}-backend`;
        if (newSystem) {
          const created = await saveSystem({
            name: systemName.trim(), code: systemCode, enabled: true,
            configuration: {}, services: [], clients: [],
          });
          setOptions((current) => ({ ...current, systems: [...current.systems, created] }));
          next = { ...next, systemId: created.id };
          update(next);
          setNewSystem(false);
          setNewClient(true);
          setNewClientId(clientId);
        }
        const applicationName = newSystem ? systemName.trim() : system?.name || systemCode;
        const functions = options.capabilities.flatMap((c) => (c.functions ?? [])
          .filter((f) => value.selected[c.code]?.includes(f.code)).map((f) => f.name));
        const created = await createCapabilityClient(selection.capabilityCode, selection.roles, clientId, {
          name: `Integraciones de ${applicationName}`.slice(0, 200),
          description: `Cliente OAuth de ${applicationName} para: ${functions.join(", ")}.`.slice(0, 2000),
        });
        setOptions((current) => ({
          ...current,
          choices: { ...current.choices, clients: [...current.choices.clients, created.client] },
        }));
        next = { ...next, clientId: created.client.clientId };
        update(next);
        setNewClient(false);
        setSecret({
          title: "Credenciales de la conexión", clientId: created.client.clientId,
          clientSecret: created.clientSecret, type: "confidential", status: "active",
        });
      }
      setResult(
        await consoleApi.post<ConnectionResult>(
          `${catalogPath}/connections/activate`,
          connectionPayload(next, options.capabilities),
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la conexión.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  async function inspectConnection(mode: "preview" | "check") {
    if (locked.current) return;
    if (reviewPending.length) { setError(reviewPending[0]); setStep(1); return; }
    if (newSystem || newClient) { setError("Guarda la conexión para preparar el acceso antes de comprobarla."); return; }
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      setResult(await consoleApi.post<ConnectionResult>(`${catalogPath}/connections/${mode}`, connectionPayload(value, options.capabilities)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo comprobar la conexión."); }
    finally { locked.current = false; setSaving(false); }
  }
  const navigation = (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 px-4 sm:min-w-28"
        disabled={step === 0}
        onClick={() => { setStep(step - 1); setError(""); }}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Atrás
      </Button>
      <Button type={step === 1 || (step === 2 && reviewPending.length > 0) ? "button" : "submit"} className="min-h-11 px-5 sm:min-w-40" loading={saving}
        onClick={step === 1 ? () => { setStep(2); setError(""); } : step === 2 && reviewPending.length > 0 ? () => { setStep(1); setError(""); } : undefined}>
        {step === 0 ? "Continuar" : step === 1 ? "Revisar conexión" : reviewPending.length ? "Completar pendientes" : result ? "Guardar cambios" : "Guardar conexión"}
        {step < 2 ? <ArrowRight className="size-4" aria-hidden="true" /> : <PlugZap className="size-4" aria-hidden="true" />}
      </Button>
    </div>
  );
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-6"
      aria-busy={saving}
    >
      <nav aria-label="Progreso de la conexión">
        <ol className="flex items-start" aria-label="Pasos de conexión">
          {["Sistema y funciones", "Configurar servicios", "Revisar y guardar"].map((name, i) => (
            <li
              key={name}
              aria-current={step === i ? "step" : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
            >
              {i < 2 && <span aria-hidden="true" className={`absolute left-1/2 top-5 h-0.5 w-full ${step > i ? "bg-primary" : "bg-border"}`} />}
              <span aria-hidden="true" className={`relative flex size-10 items-center justify-center rounded-full border-4 border-background text-sm font-semibold ${step === i ? "bg-primary text-primary-foreground ring-2 ring-primary/20" : step > i ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>
                {step > i ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`px-1 text-xs font-medium sm:text-sm ${step === i ? "text-primary" : "text-muted-foreground"}`}>{name}</span>
            </li>
          ))}
        </ol>
        <p role="status" className="sr-only">Paso {step + 1} de 3</p>
      </nav>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        <legend className="sr-only">Configurar conexión</legend>
        {step === 0 && (
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-base font-semibold">
              Elige qué necesita tu sistema
            </h2>
            <p className="text-sm text-muted-foreground">
              Elige un sistema y sus funciones.
            </p>
            <div role="group" aria-label="Origen del sistema" className="flex flex-wrap gap-2">
              <Button type="button" variant={newSystem ? "default" : "outline"} aria-pressed={newSystem} disabled={!!secret}
                onClick={() => { initializedDefaults.current.clear(); setNewSystem(true); setNewClient(false); setNewClientId(""); update(initialDraft(value.selected)); }}>
                Sistema nuevo
              </Button>
              <Button type="button" variant={!newSystem ? "default" : "outline"} aria-pressed={!newSystem} disabled={!!secret}
                onClick={() => { initializedDefaults.current.clear(); setNewSystem(false); setNewClient(false); update(initialDraft(value.selected)); }}>
                Sistema existente
              </Button>
            </div>
            {newSystem ? (
              <div className="space-y-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <Field id="connection-system-name" label="Nombre del sistema">
                  <Input id="connection-system-name" required maxLength={200} placeholder="Ej. Mi aplicación"
                    value={systemName} onChange={(e) => { setSystemName(e.target.value); if (!systemCode || systemCode === suggestedSystemCode(systemName)) setSystemCode(suggestedSystemCode(e.target.value)); }} />
                </Field>
                <details onInvalidCapture={(event) => { event.currentTarget.open = true; }}>
                  <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-ring">Identificador del sistema</summary>
                <Field id="connection-system-code" label="Código del sistema" help="Generado a partir del nombre; puedes ajustarlo.">
                  <Input id="connection-system-code" required pattern="[a-z][a-z0-9_-]{1,79}" maxLength={80}
                    aria-describedby="connection-system-code-help" value={systemCode} onChange={(e) => setSystemCode(e.target.value)} />
                </Field>
                </details>
                <p className="text-sm text-muted-foreground">El acceso se creará al guardar.</p>
              </div>
            ) : <>
            <Field id="connection-system" label="Sistema">
              <Choice
                id="connection-system"
                disabled={!!secret}
                value={value.systemId}
                options={options.systems
                  .filter((s) => s.enabled)
                  .map((s) => ({ value: s.id, label: s.name }))}
                onChange={(id) => {
                  initializedDefaults.current.clear();
                  const nextSystem = options.systems.find((s) => s.id === id);
                  setNewClient(reusableClients(nextSystem, options.choices).length === 0);
                  setNewClientId(`${nextSystem?.code ?? ""}-backend`);
                  update(
                    initialDraft(
                      value.selected,
                      nextSystem,
                      options.choices,
                    ),
                  );
                }}
              />
            </Field>
            {!options.systems.some((s) => s.enabled) && (
              <p role="status" className="text-sm">
                Elige Sistema nuevo para registrarlo aquí mismo.
              </p>
            )}
            {secret ? (
              <p className="text-sm text-muted-foreground">Acceso preparado.</p>
            ) : system && newClient ? (
              <p role="status" className="rounded-lg bg-muted p-3 text-sm">El acceso se creará al guardar.</p>
            ) : selectedClient ? (
              <p className="rounded-lg bg-muted p-3 text-sm">
                Cliente OAuth seleccionado:{" "}
                <strong>
                  {selectedClient?.name || value.clientId}
                </strong>
              </p>
            ) : system ? (
              <p role="status" className="rounded-lg bg-muted p-3 text-sm">Elige el cliente OAuth en Opciones avanzadas.</p>
            ) : (
              <p className="text-sm text-muted-foreground">El acceso se selecciona automáticamente.</p>
            )}
            {system && !secret && <details key={system.id} open={reused.length > 1 && !newClient && !value.clientId} className="rounded-lg border border-border p-4">
              <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-ring">Opciones avanzadas</summary>
              <div className="space-y-4 pt-3">
              <p className="text-sm text-muted-foreground">Puedes cambiar el cliente OAuth que utilizará este sistema.</p>
              {newClient ? (
                <Field id="connection-new-client" label="Identificador del cliente OAuth" help="Console asignará los permisos de las funciones seleccionadas al guardar.">
                  <Input id="connection-new-client" required maxLength={120} pattern="[a-z0-9][a-z0-9._-]{1,119}"
                    aria-describedby="connection-new-client-help" value={newClientId} onChange={(e) => setNewClientId(e.target.value)} />
                </Field>
              ) : (
              <Field
                id="connection-client"
                label="Cliente OAuth"
                help="Selecciona el cliente OAuth que utilizará el sistema para acceder a los servicios."
              >
                <Choice
                  id="connection-client"
                  describedBy="connection-client-help"
                  value={value.clientId}
                  options={options.choices.clients.map((c) => ({
                    value: c.clientId,
                    label: c.name && c.name !== c.clientId ? `${c.name} · ${c.clientId}` : c.clientId,
                    description: c.description,
                  }))}
                  onChange={(clientId) =>
                    { initializedDefaults.current.clear(); update({
                      ...value,
                      clientId,
                      payments: {
                        ...value.payments,
                        organizationIds: [],
                        organizationScope: "organizations",
                      },
                    }); }
                  }
                />
                {selectedClient?.description && <p className="text-xs text-muted-foreground">{selectedClient.description}</p>}
              </Field>
            )}
            <Button type="button" variant="outline"
              onClick={() => { initializedDefaults.current.clear(); setNewClient(!newClient); setNewClientId(`${system?.code ?? ""}-backend`); setError(""); }}>
              {newClient ? "Usar cliente OAuth existente" : "Crear cliente OAuth"}
            </Button>
              </div>
            </details>}
            </>}
            {options.capabilities.map((c) => {
              const services = connectionServices(c, options.choices.scopes);
              return (
              <fieldset
                key={c.code}
                className="space-y-2 rounded-lg border p-4"
              >
                <legend className="px-1 text-sm font-semibold">
                  {c.code === "legalAcceptances" ? "Hemia Legal (opcional)" : c.name}
                </legend>
                <ConnectionServicesInfo services={services} />
                {c.functions?.length ? (
                  c.functions.map((f) => (
                    <div key={f.code} className="rounded-lg border border-border p-3">
                    <label
                      className="flex min-h-10 items-center gap-3 text-sm font-medium"
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={(value.selected[c.code] ?? []).includes(
                          f.code,
                        )}
                        onChange={(e) =>
                          update({
                            selected: selectFunction(
                              value.selected,
                              c.code,
                              f.code,
                              e.target.checked,
                            ),
                          })
                        }
                      />
                      {f.name}
                      {c.code === "legalAcceptances" &&
                        f.code === "collector" &&
                        relevant.checkout && (
                          <span className="text-xs text-muted-foreground">
                            Opcional: documentos y aceptación con Hemia Legal
                          </span>
                        )}
                    </label>
                    <div className="pl-7"><ConnectionPermissions references={f.scopes} scopes={options.choices.scopes} /></div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Esta capacidad aún no tiene funciones configuradas.
                  </p>
                )}
              </fieldset>
            ); })}
            {relevant.checkout && (
              <details className="rounded-lg bg-muted p-3 text-sm">
                <summary className="cursor-pointer font-medium focus-visible:outline-ring">Documentos en los pagos</summary>
                <p className="mt-2 text-muted-foreground">Legal es opcional. Activa Registrar aceptaciones para gestionar tus documentos con Hemia Legal.</p>
              </details>
            )}
          </Card>
        )}
        {step === 1 && (
          <ConsoleDataLoader
            load={loadDetails}
            title="No se pudo cargar la configuración de los servicios"
          >
            {(details) => (
              <ConnectionConfiguration
                options={options}
                value={value}
                onChange={update}
                footer={navigation}
                {...details}
              />
            )}
          </ConsoleDataLoader>
        )}
        {step === 2 && (
          <Card className="space-y-5 p-5 sm:p-6">
            <ConnectionReview options={options} value={value} systemName={newSystem ? systemName : system?.name || ""}
              newSystem={newSystem} newClient={newClient} {...details} saved={result?.status === "configured" || result?.status === "verified"}
              onEdit={(nextStep) => { setStep(nextStep); setError(""); }} />
            {result && relevant.payments && (relevant.checkout || relevant.receiver) && !value.payments.customServices &&
              value.payments.backendBaseUrl && (
                <details className="space-y-2 text-sm">
                  <summary className="min-h-10 cursor-pointer py-2 font-medium focus-visible:outline-ring">
                    Rutas del backend
                  </summary>
                  <ul className="space-y-1 break-all">
                    {[
                      ...(relevant.receiver
                        ? ["/payments/webhooks/license"]
                        : []),
                      ...(relevant.checkout &&
                      (value.selected.payments ?? []).some((fn) =>
                        ["catalog", "subscriptions"].includes(fn),
                      )
                        ? ["/payments/integration-status"]
                        : []),
                      ...(relevant.legal ? ["/payments/legal/context"] : []),
                    ].map((path) => (
                      <li key={path}>
                        {value.payments.backendBaseUrl.replace(/\/+$/, "")}
                        {path}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            {secret && <OneTimeSecretPanel secret={secret} onDismiss={() => setSecret(null)} />}
            {!result && !newSystem && !newClient && reviewPending.length === 0 && <Button type="button" variant="outline" onClick={() => void inspectConnection("preview")}>Vista previa de la entrega</Button>}
            {result && <ConnectionDeliveryResult result={result} selection={value.selected} systemCode={system?.code || systemCode}
              oauthClient={selectedClient?.id ? { name: selectedClient.name || selectedClient.clientId, href: localizedHref(systemsHref.split("/")[1], `/identity/oauth-clients/${encodeURIComponent(selectedClient.id)}`) } : undefined}
              onCheck={() => void inspectConnection("check")} onConfigure={() => { setStep(1); setError(""); }} />}

          </Card>
        )}
        {step !== 1 && navigation}
      </fieldset>
    </form>
  );
}

export function ConnectionConfiguration({
  options,
  value,
  onChange,
  payments,
  legal,
  footer,
}: {
  options: ConnectionOptions;
  value: ConnectionDraft;
  onChange: (next: Partial<ConnectionDraft>) => void;
  payments?: PaymentsOptions;
  legal?: LegalOptions;
  footer?: ReactNode;
}) {
  const n = needs(value.selected), p = value.payments;
  const system = options.systems.find((s) => s.id === value.systemId);
  const services = (system?.services ?? []).filter((s) => s.enabled)
    .map((s) => ({ value: s.code, label: s.name }));
  const policy = payments?.policies.find((entry) => entry.clientId === value.clientId);
  const integration = legal?.integrations.find((i) => i.systemId === value.systemId);
  const selected = options.capabilities.filter((c) => value.selected[c.code]?.length);
  const fields = selected.flatMap((capability) =>
    schemaFields(capability, value.selected, n.payments && !p.customServices && (n.checkout || n.receiver))
      .map((field) => ({ capability, field })),
  );
  const needsBackend = n.payments && (n.checkout || n.receiver);
  const documents = legal?.documents.filter((d) => d.applicationId === value.legal.applicationId) ?? [];
  const existing = initialDraft(value.selected, system, options.choices);
  const product = payments?.products.find((entry) => entry.code === p.productCode);
  const application = legal?.applications.find((entry) => entry.id === value.legal.applicationId);
  const selectedDocuments = documents.filter((d) => value.legal.documentIds.includes(d.id));
  const recoveredDocuments = Boolean(integration && application && integration.applicationId === value.legal.applicationId && value.legal.documentIds.length > 0 && selectedDocuments.length === value.legal.documentIds.length && integration.documentIds.length === value.legal.documentIds.length && value.legal.documentIds.every((id) => integration.documentIds.includes(id)));

  function payment(next: Partial<ConnectionDraft["payments"]>) {
    onChange({ payments: { ...p, ...next } });
  }
  function renderField({ capability, field }: typeof fields[number]) {
    const displayField = capability.code === "legalAcceptances"
      ? field.key === "identityIssuer"
        ? { ...field, label: "Origen de las cuentas", description: "Identificador de los usuarios de tu aplicación en Legal, por ejemplo urn:hemia:mi-aplicacion." }
        : field.key === "productCode"
          ? { ...field, label: "Código del producto", description: "El código con el que tu producto se identifica en Legal." }
          : field
      : field;
    return (
      <RecoveredConfiguration key={`${capability.code}-${field.key}`} label={displayField.label} collapsible
        configured={Boolean(field.required && system?.configuration[capability.code]?.[field.key] === value.configuration[capability.code]?.[field.key] && value.configuration[capability.code]?.[field.key] !== undefined && value.configuration[capability.code]?.[field.key] !== null && String(value.configuration[capability.code]?.[field.key]).trim() !== "" && (field.format !== "service" || services.some((s) => s.value === value.configuration[capability.code]?.[field.key])) && (!field.options || field.options.includes(String(value.configuration[capability.code]?.[field.key]))))}
        summary={field.format === "service" ? services.find((s) => s.value === value.configuration[capability.code]?.[field.key])?.label : field.type === "boolean" ? (value.configuration[capability.code]?.[field.key] ? "Sí" : "No") : String(value.configuration[capability.code]?.[field.key] ?? "")}>
      <ConfigurationField
        key={`${capability.code}-${field.key}`}
        id={`connection-${capability.code}-${field.key}`}
        field={{ ...displayField, description: undefined }}
        value={value.configuration[capability.code]?.[field.key]}
        services={system?.services}
        onChange={(next) => onChange({
          configuration: {
            ...value.configuration,
            [capability.code]: { ...value.configuration[capability.code], [field.key]: next },
          },
        })}
      />
      {displayField.description && (
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="min-h-10 cursor-pointer py-2 focus-visible:outline-ring">Ayuda: {displayField.label}</summary>
          <p>{displayField.description}</p>
        </details>
      )}
      </RecoveredConfiguration>
    );
  }
  return (
    <>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Configurar servicios</h2>
        <p className="text-sm text-muted-foreground">Completa lo que falta o cambia los datos recuperados. * Obligatorio.</p>
      </div>

      {selected.map((capability) => {
        const isLegal = capability.code === "legalAcceptances";
        const isPayments = capability.code === "payments";
        const apiServices = connectionServices(capability, options.choices.scopes, value.selected[capability.code]);
        const serviceName = isLegal ? "Hemia Legal" : capability.name;
        const serviceNeedsBackend = needsBackend && isPayments;
        const serviceFields = fields.filter((entry) => entry.capability.code === capability.code);
        const requiredFields = serviceFields.filter(({ field }) => field.required);
        const optionalFields = serviceFields.filter(({ field }) => !field.required);
        return (
          <section key={capability.code} aria-labelledby={`connection-service-${capability.code}`}>
            <Card className="space-y-6 overflow-hidden p-5 sm:p-6">
              <div className="space-y-3 border-b border-border pb-5">
                <div className="space-y-1">
                  <h3 id={`connection-service-${capability.code}`} className="text-base font-semibold">{serviceName}</h3>
                  {apiServices.length ? <ConnectionServicesInfo services={apiServices} /> : <p className="text-sm text-muted-foreground">{isLegal
                    ? "Documentos y evidencia de aceptación de tus usuarios."
                    : isPayments ? "Planes, cobros y licencias de tu producto." : "Configura las funciones que utilizará tu sistema en este servicio."}</p>}
                </div>
                <ul aria-label={`Funciones de ${serviceName}`} className="flex flex-wrap gap-2">
                  {(capability.functions ?? []).filter((f) => value.selected[capability.code].includes(f.code))
                    .map((f) => <li key={f.code} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">{isLegal && f.code === "collector" ? "Aceptación de documentos" : f.name}</li>)}
                </ul>
                <ConnectionPermissions references={(capability.functions ?? []).filter((f) => value.selected[capability.code].includes(f.code)).flatMap((f) => f.scopes)} scopes={options.choices.scopes} />
              </div>
              {isLegal && n.legal && (
                <RecoveredConfiguration label="Documentos legales" configured={recoveredDocuments} summary={<>{application?.name}<ul className="mt-1 list-inside list-disc">{selectedDocuments.map((d) => <li key={d.id}>{d.name}</li>)}</ul></>}>
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Documentos legales</h4>
                    <p className="text-sm text-muted-foreground">Elige los documentos que aceptarán tus usuarios.</p>
                  </div>
                  <Field id="connection-application" label="Aplicación en Legal *">
                    <Choice id="connection-application" value={value.legal.applicationId}
                      placeholder="Elige dónde están tus documentos" disabled={!legal?.applications.length}
                      options={(legal?.applications ?? []).map((a) => ({ value: a.id, label: a.name }))}
                      onChange={(applicationId) => onChange({ legal: { applicationId, documentIds: [] } })} />
                  </Field>
                  {!legal?.applications.length && <p role="status" className="text-sm text-muted-foreground">No hay aplicaciones disponibles. Registra una aplicación y publica sus documentos en Legal para continuar.</p>}
                  {integration && <Button type="button" variant="outline" className="min-h-10"
                    onClick={() => onChange({ legal: { applicationId: integration.applicationId, documentIds: integration.documentIds } })}>
                    Usar documentos de la conexión actual
                  </Button>}
                  {value.legal.applicationId ? (
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-sm font-medium">Documentos que deben aceptar *</legend>
                      {documents.map((d) => <label key={d.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
                        <input type="checkbox" className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          checked={value.legal.documentIds.includes(d.id)}
                          onChange={(e) => onChange({ legal: { ...value.legal, documentIds: e.target.checked
                            ? [...value.legal.documentIds, d.id] : value.legal.documentIds.filter((id) => id !== d.id) } })} />
                        {d.name}
                      </label>)}
                      {!documents.length && <p role="status" className="text-sm text-muted-foreground">Esta aplicación no tiene documentos disponibles. Publícalos en Legal para poder seleccionarlos.</p>}
                      {!!documents.length && <p role="status" className="text-xs text-muted-foreground">{documents.filter((d) => value.legal.documentIds.includes(d.id)).length} de {documents.length} seleccionados</p>}
                    </fieldset>
                  ) : !!legal?.applications.length && <p className="text-sm text-muted-foreground">Al elegir una aplicación verás sus documentos disponibles.</p>}
                </div>
                </RecoveredConfiguration>
              )}

              {(isPayments || requiredFields.length > 0) && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{isPayments || isLegal ? "Datos del producto" : "Datos de las funciones"}</h4>
                  </div>
                  {isPayments && <RecoveredConfiguration label="Producto en Billing" configured={Boolean(product && (existing.payments.productCode === p.productCode || policy?.products?.includes(p.productCode)))} summary={product?.name}>
                  <Field id="connection-product" label="Producto en Billing *">
                    <Choice id="connection-product" value={p.productCode} placeholder="Elige el producto"
                      disabled={!payments?.products.length}
                      options={(payments?.products ?? []).map((v) => ({ value: v.code, label: v.name }))}
                      onChange={(productCode) => payment({ productCode })} />
                    {!payments?.products.length && <p role="status" className="text-sm text-muted-foreground">No hay productos disponibles. Registra el producto en Billing para continuar.</p>}
                  </Field></RecoveredConfiguration>}
                  {requiredFields.length > 0 && <div className="grid gap-5 md:grid-cols-2">{requiredFields.map(renderField)}</div>}
                  {isPayments && n.organizations && <RecoveredConfiguration label="Organizaciones autorizadas" configured={Boolean(policy && p.organizationScope === policy.organizationScope && (p.organizationScope === "all_for_allowed_products" || (p.organizationIds.length > 0 && p.organizationIds.length === policy.organizationIds?.length && p.organizationIds.every((id) => policy.organizationIds?.includes(id) && payments?.organizations.some((o) => o.id === id)))))} summary={p.organizationScope === "all_for_allowed_products" ? "Todas las autorizadas para este producto" : payments?.organizations.filter((o) => p.organizationIds.includes(o.id)).map((o) => o.name).join(", ")}>
                  <div className="space-y-4 border-t border-border pt-5">
                    <Field id="connection-scope" label="¿Qué organizaciones podrán usar estas funciones? *">
                      <Choice id="connection-scope" value={p.organizationScope}
                        options={[{ value: "organizations", label: "Solo las que seleccione" }, { value: "all_for_allowed_products", label: "Todas las autorizadas para este producto" }]}
                        onChange={(scope) => payment({ organizationScope: scope as typeof p.organizationScope, organizationIds: [] })} />
                    </Field>
                    {policy && <Button type="button" variant="outline" className="min-h-10"
                      onClick={() => payment({ organizationScope: policy.organizationScope, organizationIds: policy.organizationIds ?? [] })}>
                      Usar organizaciones de la conexión actual
                    </Button>}
                    {p.organizationScope === "organizations" && <fieldset className="max-h-64 space-y-2 overflow-auto">
                      <legend className="mb-2 text-sm font-medium">Seleccionar organizaciones</legend>
                      {payments?.organizations.map((o) => <label key={o.id} className="flex min-h-11 items-center gap-3 text-sm">
                        <input type="checkbox" className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          checked={p.organizationIds.includes(o.id)} onChange={(e) => payment({ organizationIds: e.target.checked
                            ? [...p.organizationIds, o.id] : p.organizationIds.filter((id) => id !== o.id) })} />{o.name}
                      </label>)}
                      {!payments?.organizations.length && <p role="status" className="text-sm text-muted-foreground">No hay organizaciones disponibles para seleccionar.</p>}
                    </fieldset>}
                  </div></RecoveredConfiguration>}
                </div>
              )}

              {(serviceNeedsBackend || (isPayments && n.checkout)) && (
                <div className="space-y-5 border-t border-border pt-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Conexión con tu aplicación</h4>
                    <p className="text-sm text-muted-foreground">Configura las direcciones de tu aplicación.</p>
                  </div>
                  {serviceNeedsBackend && !p.customServices && <RecoveredConfiguration label="Dirección del backend" configured={Boolean(existing.payments.backendBaseUrl && existing.payments.backendBaseUrl === p.backendBaseUrl)} summary={p.backendBaseUrl}>
                  <Field id="connection-backend" label="Dirección del backend *" help="Incluye el prefijo de tu API, si lo tiene.">
                    <Input id="connection-backend" type="url" required className="h-10" placeholder="https://api.tuapp.com/api"
                      aria-describedby="connection-backend-help" value={p.backendBaseUrl} onChange={(e) => payment({ backendBaseUrl: e.target.value })} />
                  </Field></RecoveredConfiguration>}
                  {serviceNeedsBackend && p.customServices && <p className="text-sm text-muted-foreground">Esta conexión utiliza servicios personalizados. Puedes ajustarlos en Opciones avanzadas.</p>}
                  {n.checkout && <div className="grid gap-5 md:grid-cols-2">
                    {(["successUrl", "cancelUrl"] as const).map((key) => <RecoveredConfiguration key={key} label={key === "successUrl" ? "Página al completar el pago" : "Página al cancelar el pago"} configured={Boolean(existing.payments[key] && existing.payments[key] === p[key])} summary={p[key]}><Field id={`connection-${key}`}
                      label={key === "successUrl" ? "Página al completar el pago *" : "Página al cancelar el pago *"}>
                      <Input id={`connection-${key}`} type="url" required className="h-10" placeholder="https://tuapp.com/…"
                        value={p[key]} onChange={(e) => payment({ [key]: e.target.value })} />
                    </Field></RecoveredConfiguration>)}
                  </div>}
                </div>
              )}

              {(serviceNeedsBackend || optionalFields.length > 0) && (
                <details aria-label={`Opciones avanzadas de ${serviceName}`} open={(isPayments && n.receiver && p.customServices && !services.some((s) => s.value === p.receiverService)) || undefined} className="rounded-xl border border-border bg-card"
                  onInvalidCapture={(event) => { event.currentTarget.open = true; }}>
                  <summary className="cursor-pointer rounded-xl px-5 py-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">Opciones avanzadas</summary>
                  <div className="space-y-5 border-t border-border p-5 sm:p-6">
                    <p className="text-sm text-muted-foreground">Ajusta estas opciones si tu aplicación ya utiliza una configuración particular.</p>
                    {serviceNeedsBackend && <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input type="checkbox" className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        checked={p.customServices} onChange={(e) => payment({ customServices: e.target.checked })} />
                      Usar servicios personalizados
                    </label>}
                    {isPayments && n.checkout && p.customServices && (value.selected.payments ?? []).some((fn) => ["catalog", "subscriptions"].includes(fn)) && (
                      <Field id="connection-check" label="Comprobación del backend (opcional)" help="Elige un servicio si quieres comprobar la configuración instalada.">
                        <Choice id="connection-check" value={p.checkService} options={[{ value: "", label: "Sin comprobación del backend" }, ...services]}
                          onChange={(checkService) => payment({ checkService })} />
                      </Field>
                    )}
                    {isPayments && n.receiver && p.customServices && <Field id="connection-receiver" label="Receptor de licencias *">
                      <Choice id="connection-receiver" value={p.receiverService} options={services} onChange={(receiverService) => payment({ receiverService })} />
                    </Field>}
                    <div className="grid gap-5 md:grid-cols-2">{optionalFields.map(renderField)}</div>
                  </div>
                </details>
              )}
              {!isPayments && !(isLegal && n.legal) && !serviceFields.length && <p className="text-sm text-muted-foreground">Este servicio no requiere datos adicionales. Puedes continuar.</p>}
            </Card>
          </section>
        );
      })}
      {footer}
    </>
  );
}

export function Connections({
  preset,
  systemsHref,
}: {
  preset?: string;
  systemsHref: string;
}) {
  return (
    <ConsoleDataLoader
      load={load}
      title="No se pudo cargar el alta de conexiones"
    >
      {(options) => (
        <ConnectionForm
          options={options}
          preset={preset}
          systemsHref={systemsHref}
        />
      )}
    </ConsoleDataLoader>
  );
}
