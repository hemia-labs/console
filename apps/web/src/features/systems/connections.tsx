"use client";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Copy, PlugZap } from "lucide-react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { consoleApi } from "@/lib/console-api";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { Input } from "@/components/zuno/input";
import {
  Choice,
  ConfigurationField,
  Field,
} from "./catalog-fields";
import { catalogPath } from "./types";
import {
  connectionPayload,
  configurationError,
  initialDraft,
  needs,
  presetSelection,
  reusableClients,
  schemaFields,
  selectFunction,
  type ConnectionDraft,
  type ConnectionOptions,
  type LegalOptions,
  type PaymentsOptions,
} from "./connections-model";
export type ConnectionResult = {
  ready: boolean;
  status: "configured" | "verified" | "pending";
  steps: { name: string; state: "done" | "pending"; message?: string }[];
  configuration: Record<string, string>;
  secretVariable?: string;
};
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
export function ConnectionForm({ options, preset, systemsHref }: FormProps) {
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
        const key = `${value.systemId}/${value.clientId}`;
        const policy = payments?.policies.find(
          (entry) => entry.clientId === value.clientId,
        );
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
    [relevant.payments, relevant.legal, value.systemId, value.clientId],
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    if (step === 0) {
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
    const invalid = configurationError(value, options.capabilities);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (step === 1) {
      setStep(2);
      setError("");
      return;
    }
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      setResult(
        await consoleApi.post<ConnectionResult>(
          `${catalogPath}/connections/activate`,
          connectionPayload(value, options.capabilities),
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
      <Button type="submit" className="min-h-11 px-5 sm:min-w-40" loading={saving}>
        {step < 2 ? "Continuar" : result?.status === "pending" ? "Reintentar conexión" : "Guardar conexión"}
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
          {["Sistema y funciones", "Configuración", "Revisar y guardar"].map((name, i) => (
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
              Se habilitan las funciones seleccionadas y se conservan los
              permisos existentes. Se reutiliza la identidad de tu backend.
            </p>
            <Field id="connection-system" label="Sistema">
              <Choice
                id="connection-system"
                value={value.systemId}
                options={options.systems
                  .filter((s) => s.enabled)
                  .map((s) => ({ value: s.id, label: s.name }))}
                onChange={(id) =>
                  update(
                    initialDraft(
                      value.selected,
                      options.systems.find((s) => s.id === id),
                      options.choices,
                    ),
                  )
                }
              />
            </Field>
            {!options.systems.some((s) => s.enabled) && (
              <p role="status" className="text-sm">
                Registra un sistema habilitado para crear su conexión.
              </p>
            )}
            {reused.length === 1 && value.clientId === reused[0] ? (
              <p className="rounded-lg bg-muted p-3 text-sm">
                Cliente reutilizado:{" "}
                <strong>
                  {options.choices.clients.find(
                    (c) => c.clientId === value.clientId,
                  )?.name || value.clientId}
                </strong>
              </p>
            ) : (
              <Field
                id="connection-client"
                label="Cliente del backend"
                help="Selecciona una identidad existente. Si necesitas crearla, usa el formulario del sistema."
              >
                <Choice
                  id="connection-client"
                  value={value.clientId}
                  options={options.choices.clients.map((c) => ({
                    value: c.clientId,
                    label: c.name || c.clientId,
                  }))}
                  onChange={(clientId) =>
                    update({
                      ...value,
                      clientId,
                      payments: {
                        ...value.payments,
                        organizationIds: [],
                        organizationScope: "organizations",
                      },
                    })
                  }
                />
              </Field>
            )}
            <Link
              href={
                system
                  ? `${systemsHref}/${system.id}/edit`
                  : `${systemsHref}/new`
              }
              className="inline-flex min-h-10 items-center text-sm text-primary underline underline-offset-4"
            >
              {system ? "Administrar sistema y servicios" : "Registrar sistema"}
            </Link>
            {options.capabilities.map((c) => (
              <fieldset
                key={c.code}
                className="space-y-2 rounded-lg border p-4"
              >
                <legend className="px-1 text-sm font-semibold">
                  {c.code === "legalAcceptances"
                    ? "Hemia Legal (opcional)"
                    : c.name}
                </legend>
                {c.functions?.length ? (
                  c.functions.map((f) => (
                    <label
                      key={f.code}
                      className="flex min-h-10 items-center gap-3 text-sm"
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Esta capacidad aún no tiene funciones configuradas.
                  </p>
                )}
              </fieldset>
            ))}
            {relevant.checkout && (
              <p role="note" className="rounded-lg bg-muted p-3 text-sm">
                Si tu aplicación ya gestiona sus documentos, puedes integrar
                solo pagos sin Hemia Legal ni legalAcceptanceId. Activa
                Registrar aceptaciones si quieres gestionar los documentos con
                Hemia Legal.
              </p>
            )}
          </Card>
        )}
        {step === 1 && (
          <ConsoleDataLoader
            load={loadDetails}
            title="No se pudo cargar la configuración de las funciones"
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
            <h2 className="text-base font-semibold">
              Revisa la conexión de {system?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Revisa los datos y guarda la conexión para obtener la configuración del backend.
            </p>
            <dl className="grid gap-4 border-y border-border py-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Sistema</dt><dd className="mt-1 font-medium">{system?.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Cliente del backend</dt><dd className="mt-1 break-all font-mono">{value.clientId}</dd></div>
            </dl>
            <h3 className="text-sm font-semibold">Funciones que se habilitarán</h3>
            <ul className="divide-y divide-border text-sm">
              {options.capabilities
                .filter((c) => value.selected[c.code]?.length)
                .map((c) => (
                  <li key={c.code} className="py-3">
                    <strong>{c.name}:</strong>{" "}
                    {(c.functions ?? [])
                      .filter((f) => value.selected[c.code].includes(f.code))
                      .map((f) => f.name)
                      .join(", ")}
                  </li>
                ))}
            </ul>
            {!value.payments.customServices &&
              value.payments.backendBaseUrl && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    Servicios estándar que se registrarán
                  </p>
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
                </div>
              )}
            <p className="text-sm text-muted-foreground">
              Las funciones se agregan a la identidad existente. Los permisos
              anteriores se administran desde el sistema.
            </p>
            {!result && (
              <ConnectionConfigurationOutput
                configuration={connectionPayload(value, options.capabilities)}
                preview
              />
            )}
            {result && (
              <div aria-live="polite" className="space-y-4">
                <p className="font-medium">{connectionStatus[result.status]}</p>
                <p className="text-sm text-muted-foreground">
                  {result.status === "verified"
                    ? "Se comprobó el backend instalado."
                    : result.status === "configured"
                      ? "Los permisos y la configuración quedaron guardados. Este alta no comprueba el funcionamiento del backend."
                      : "Quedan pasos pendientes. Corrige el detalle indicado y vuelve a intentar."}
                </p>
                <ul className="space-y-3">
                  {result.steps.map((s) => (
                    <li key={s.name} className="flex gap-3 text-sm">
                      {s.state === "done" ? (
                        <CheckCircle2
                          className="size-5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="size-5 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span>
                        {s.name}
                        {s.message && (
                          <span className="mt-1 block text-muted-foreground">
                            {s.message}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {Object.keys(result.configuration).length > 0 && (
                  <ConnectionConfigurationOutput
                    configuration={result.configuration}
                    secretVariable={result.secretVariable}
                  />
                )}
              </div>
            )}
          </Card>
        )}
        {step !== 1 && navigation}
      </fieldset>
    </form>
  );
}

export function ConnectionConfigurationOutput({ configuration, secretVariable, preview = false }: {
  configuration: Record<string, unknown>;
  secretVariable?: string;
  preview?: boolean;
}) {
  const [format, setFormat] = useState("json");
  const [copyStatus, setCopyStatus] = useState("");
  const content = format === "json"
    ? JSON.stringify(configuration, null, 2)
    : Object.entries(configuration).map(([key, value]) => `${key}=${value}`).join("\n");
  return (
    <section aria-labelledby="connection-output-title" className="space-y-4 border-t border-border pt-5">
      <div>
        <h3 id="connection-output-title" className="text-base font-semibold">{preview ? "JSON de la conexión" : "Configuración del backend"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{preview
          ? "Estos datos se enviarán a Console al guardar."
          : "Usa estas claves en las variables de entorno de tu backend (.env o panel de despliegue) y reinícialo."}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-4 py-2">
          <div className="flex items-center gap-2">
            {preview ? <span className="text-xs font-medium">JSON · Vista previa</span> : <>
            <label htmlFor="connection-output-format" className="text-xs font-medium">Formato</label>
            <Choice
              id="connection-output-format"
              value={format}
              onChange={(next) => {
                setFormat(next);
                setCopyStatus("");
              }}
              options={[
                { value: "json", label: "JSON" },
                { value: "env", label: ".env" },
              ]}
            />
            </>}
          </div>
          <Button type="button" variant="outline" className="min-h-10" onClick={() => {
            void navigator.clipboard.writeText(content).then(() => setCopyStatus("Configuración copiada")).catch(() => setCopyStatus("No se pudo copiar. Selecciona el contenido y cópialo manualmente."));
          }}><Copy className="size-4" aria-hidden="true" />Copiar {format === "json" ? "JSON" : ".env"}</Button>
        </div>
        <pre tabIndex={0} aria-label="Configuración generada" className="max-h-96 overflow-auto bg-background p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-ring"><code>{content}</code></pre>
      </div>
      <p role="status" className="text-xs text-muted-foreground">{copyStatus}</p>
      {secretVariable && <p className="break-words text-sm text-muted-foreground">Usa el secreto existente de tu backend en <code className="break-all font-mono text-foreground">{secretVariable}</code>.</p>}
    </section>
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
  const n = needs(value.selected),
    p = value.payments,
    system = options.systems.find((s) => s.id === value.systemId);
  const services = (system?.services ?? [])
    .filter((s) => s.enabled)
    .map((s) => ({ value: s.code, label: s.name }));
  const policy = payments?.policies.find(
    (entry) => entry.clientId === value.clientId,
  );
  const integration = legal?.integrations.find(
    (i) => i.systemId === value.systemId,
  );
  function payment(next: Partial<ConnectionDraft["payments"]>) {
    onChange({ payments: { ...p, ...next } });
  }
  return (
    <>
    <Card className="space-y-5 p-5 sm:p-6">
      <h2 className="text-base font-semibold">
        Configuración de las funciones seleccionadas
      </h2>
      {n.payments && (
        <Field id="connection-product" label="Producto">
          <Choice
            id="connection-product"
            value={p.productCode}
            options={(payments?.products ?? []).map((v) => ({
              value: v.code,
              label: v.name,
            }))}
            onChange={(productCode) => payment({ productCode })}
          />
        </Field>
      )}
      {n.payments && (n.checkout || n.receiver || n.legal) && (
        <div className="space-y-3">
          <label className="flex min-h-10 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={p.customServices}
              onChange={(e) => payment({ customServices: e.target.checked })}
            />
            Usar servicios personalizados (avanzado)
          </label>
          {!p.customServices && (
            <Field
              id="connection-backend"
              label="URL base del backend"
              help="Incluye el prefijo de tu API, por ejemplo https://api.atlas.com/api. Console registra las rutas estándar del SDK para licencias, comprobación y, si lo seleccionaste, contexto Legal. La audiencia se toma del cliente de Identity."
            >
              <Input
                id="connection-backend"
                type="url"
                required
                className="h-10"
                value={p.backendBaseUrl}
                onChange={(e) => payment({ backendBaseUrl: e.target.value })}
              />
            </Field>
          )}
        </div>
      )}
      {n.organizations && (
        <>
          <Field id="connection-scope" label="Organizaciones autorizadas">
            <Choice
              id="connection-scope"
              value={p.organizationScope}
              options={[
                { value: "organizations", label: "Solo las seleccionadas" },
                {
                  value: "all_for_allowed_products",
                  label: "Todas, solo para productos autorizados",
                },
              ]}
              onChange={(scope) =>
                payment({
                  organizationScope: scope as typeof p.organizationScope,
                  organizationIds: [],
                })
              }
            />
          </Field>
          {policy && (
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() =>
                payment({
                  organizationScope: policy.organizationScope,
                  organizationIds: policy.organizationIds ?? [],
                })
              }
            >
              Usar alcance actual del cliente
            </Button>
          )}
          {p.organizationScope === "organizations" && (
            <fieldset className="max-h-64 space-y-2 overflow-auto">
              <legend className="text-sm font-medium">
                Seleccionar organizaciones
              </legend>
              {payments?.organizations.map((o) => (
                <label
                  key={o.id}
                  className="flex min-h-10 items-center gap-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={p.organizationIds.includes(o.id)}
                    onChange={(e) =>
                      payment({
                        organizationIds: e.target.checked
                          ? [...p.organizationIds, o.id]
                          : p.organizationIds.filter((id) => id !== o.id),
                      })
                    }
                  />
                  {o.name}
                </label>
              ))}
              {!payments?.organizations.length && (
                <p role="status" className="text-sm text-muted-foreground">
                  No hay organizaciones disponibles.
                </p>
              )}
            </fieldset>
          )}
        </>
      )}
      {n.checkout && (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {(["successUrl", "cancelUrl"] as const).map((key) => (
              <Field
                key={key}
                id={`connection-${key}`}
                label={
                  key === "successUrl"
                    ? "Regreso después del pago"
                    : "Regreso al cancelar"
                }
              >
                <Input
                  id={`connection-${key}`}
                  className="h-10"
                  type="url"
                  required
                  value={p[key]}
                  onChange={(e) => payment({ [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          {p.customServices &&
            (value.selected.payments ?? []).some((fn) =>
              ["catalog", "subscriptions"].includes(fn),
            ) && (
              <Field
                id="connection-check"
                label="Comprobación del backend (opcional)"
                help="Selecciona un servicio para comprobar la configuración instalada. Sin él, la conexión quedará configurada."
              >
                <Choice
                  id="connection-check"
                  value={p.checkService}
                  options={[
                    { value: "", label: "Sin comprobación del backend" },
                    ...services,
                  ]}
                  onChange={(checkService) => payment({ checkService })}
                />
              </Field>
            )}
        </>
      )}
      {n.receiver && p.customServices && (
        <Field id="connection-receiver" label="Receptor de licencias">
          <Choice
            id="connection-receiver"
            value={p.receiverService}
            options={services}
            onChange={(receiverService) => payment({ receiverService })}
          />
        </Field>
      )}
      {n.legal && (
        <>
          <p className="text-sm text-muted-foreground">
            La identidad de origen de Legal identifica a tus usuarios en los
            documentos; conserva su namespace registrado, que puede ser distinto
            del emisor OAuth.
          </p>
          <Field id="connection-application" label="Aplicación legal">
            <Choice
              id="connection-application"
              value={value.legal.applicationId}
              options={(legal?.applications ?? []).map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              onChange={(applicationId) =>
                onChange({ legal: { applicationId, documentIds: [] } })
              }
            />
          </Field>
          {integration && (
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() =>
                onChange({
                  legal: {
                    applicationId: integration.applicationId,
                    documentIds: integration.documentIds,
                  },
                })
              }
            >
              Usar aplicación y documentos actuales
            </Button>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Documentos que se presentarán al comprador
            </legend>
            {legal?.documents
              .filter((d) => d.applicationId === value.legal.applicationId)
              .map((d) => (
                <label
                  key={d.id}
                  className="flex min-h-10 items-center gap-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={value.legal.documentIds.includes(d.id)}
                    onChange={(e) =>
                      onChange({
                        legal: {
                          ...value.legal,
                          documentIds: e.target.checked
                            ? [...value.legal.documentIds, d.id]
                            : value.legal.documentIds.filter(
                                (id) => id !== d.id,
                              ),
                        },
                      })
                    }
                  />
                  {d.name}
                </label>
              ))}
            {value.legal.applicationId &&
              !legal?.documents.some(
                (d) => d.applicationId === value.legal.applicationId,
              ) && (
                <p role="status" className="text-sm text-muted-foreground">
                  Esta aplicación no tiene documentos disponibles.
                </p>
              )}
          </fieldset>
        </>
      )}
      {options.capabilities
        .filter((c) => value.selected[c.code]?.length)
        .map((c) => (
          <section key={c.code} className="space-y-4">
            {schemaFields(c, value.selected, n.payments && !p.customServices)
              .length > 0 && (
              <h3 className="text-sm font-semibold">{c.name}</h3>
            )}
            <div className="grid gap-5 md:grid-cols-2">
              {schemaFields(
                c,
                value.selected,
                n.payments && !p.customServices,
              ).map((field) => (
                <ConfigurationField
                  key={field.key}
                  id={`connection-${c.code}-${field.key}`}
                  field={field}
                  value={value.configuration[c.code]?.[field.key]}
                  services={system?.services}
                  onChange={(next) =>
                    onChange({
                      configuration: {
                        ...value.configuration,
                        [c.code]: {
                          ...value.configuration[c.code],
                          [field.key]: next,
                        },
                      },
                    })
                  }
                />
              ))}
            </div>
          </section>
        ))}
    </Card>
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
