"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/zuno/button";
import { Choice } from "./catalog-fields";
import {
  connectionEnv,
  type ConnectionResult,
} from "./connection-delivery-model";
import type { Selection } from "./connections-model";
import {
  ConfigurationReadView,
  ConfigurationFileView,
} from "./connection-configuration-view";

export function ConnectionConfigurationOutput({
  configuration,
  secretVariable,
  preview = false,
  unsaved = false,
  selection,
  systemCode = "conexion",
  oauthClient,
  connectionReference,
  advancedConfiguration,
}: {
  configuration: Record<string, unknown>;
  secretVariable?: string;
  preview?: boolean;
  unsaved?: boolean;
  selection?: Selection;
  systemCode?: string;
  oauthClient?: { name: string; href: string };
  connectionReference?: ConnectionResult["connectionReference"];
  advancedConfiguration?: Record<string, unknown>;
}) {
  const [format, setFormat] = useState(preview ? "json" : "env");
  const [status, setStatus] = useState("");
  let env = "", advancedEnv = "",
    envError = "";
  if (!preview)
    try {
      env = connectionEnv(configuration, secretVariable);
      if (advancedConfiguration)
        advancedEnv = connectionEnv(advancedConfiguration, secretVariable);
    } catch (error) {
      envError =
        error instanceof Error
          ? error.message
          : "No se pudo preparar el archivo .env.";
    }
  const content =
    format === "json" ? JSON.stringify(configuration, null, 2) : env;
  const remote = Boolean(configuration.HEMIA_CONNECTION);
  const payments = Boolean(configuration.PAYMENTS_CONNECTION || remote);
  const legal = Boolean(
    configuration.LEGAL_API_BASE_URL || selection?.legalAcceptances?.length,
  );
  const receiver = selection?.payments?.includes("receiver");
  function download(file = env, suffix = "") {
    try {
      const url = URL.createObjectURL(
        new Blob([file], { type: "text/plain;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `hemia-${systemCode.replace(/[^a-z0-9_-]/gi, "-") || "conexion"}${suffix}.env`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus("Archivo .env preparado para descargar.");
    } catch {
      setStatus("No se pudo descargar. Copia el contenido del archivo.");
    }
  }
  return (
    <section
      aria-labelledby="connection-output-title"
      className="space-y-4 border-t border-border pt-5"
    >
      <div className="space-y-1">
        <h3 id="connection-output-title" className="text-base font-semibold">
          {preview
            ? "JSON de la conexión"
            : unsaved
              ? "Vista previa de la configuración"
              : "Configuración del backend"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {preview
            ? "Estos datos se enviarán a Console al guardar."
            : unsaved
              ? "Vista previa sin guardar cambios."
              : "Descarga el .env y completa el secreto en tu backend."}
        </p>
      </div>
      {remote && connectionReference && (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>El SDK carga la configuración de esta conexión al iniciar.</p>
          {!connectionReference.published && <p role="status">Guarda la conexión para publicar su configuración.</p>}
          <p className="text-xs">Requiere @hemia/payments {connectionReference.sdkVersion} o posterior. Comprueba su disponibilidad en npm antes de actualizar tu backend.</p>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-4 py-2">
          <div className="flex items-center gap-2">
            {preview ? (
              <span className="text-xs font-medium">JSON · Vista previa</span>
            ) : (
              <>
                <label
                  htmlFor="connection-output-format"
                  className="text-xs font-medium"
                >
                  Vista
                </label>
                <Choice
                  id="connection-output-format"
                  value={format}
                  onChange={(next) => {
                    setFormat(next);
                    setStatus("");
                  }}
                  options={[
                    { value: "readable", label: "Lectura guiada" },
                    { value: "env", label: "Archivo .env" },
                    { value: "json", label: "JSON" },
                  ]}
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={format !== "json" && Boolean(envError)}
              onClick={() => {
                void navigator.clipboard
                  .writeText(content)
                  .then(() => setStatus("Configuración copiada."))
                  .catch(() =>
                    setStatus(
                      "No se pudo copiar. Selecciona y copia el contenido manualmente.",
                    ),
                  );
              }}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copiar {format === "json" ? "JSON" : ".env"}
            </Button>
            {!preview && (
              <Button
                type="button"
                disabled={Boolean(envError)}
                onClick={() => download()}
              >
                <Download className="size-4" aria-hidden="true" />
                Descargar .env
              </Button>
            )}
          </div>
        </div>
        {format === "readable" ? (
          <ConfigurationReadView
            configuration={configuration}
            secretVariable={secretVariable}
          />
        ) : (
          <ConfigurationFileView content={content} env={format === "env"} />
        )}
      </div>
      {advancedConfiguration && advancedEnv && (
        <details className="rounded-lg border border-border p-4">
          <summary className="cursor-pointer text-sm font-medium">Configuración avanzada</summary>
          <p className="my-3 text-xs text-muted-foreground">Archivo completo para diagnóstico o para versiones anteriores del SDK.</p>
          <Button type="button" variant="outline" onClick={() => download(advancedEnv, "-advanced")}>Descargar .env avanzado</Button>
          <ConfigurationFileView content={advancedEnv} env />
        </details>
      )}
      {!preview && secretVariable && (
        <section className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
          <h4 className="text-sm font-semibold">
            Secreto del cliente OAuth
          </h4>
          <p className="text-sm text-muted-foreground">
            Completa <code>{secretVariable}</code> con el secreto del .env de tu
            backend o del gestor de secretos de este entorno. Console no puede
            volver a mostrarlo.
          </p>
          {oauthClient && (
            <Link
              href={oauthClient.href}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              className="inline-block rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Abrir cliente OAuth: {oauthClient.name} (nueva pestaña)
            </Link>
          )}
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer py-2 font-medium text-foreground">
              Si no tienes el secreto
            </summary>
            <p>
              En Identity → Clientes OAuth, abre este cliente y elige{" "}
              <strong>Rotar secreto</strong> en su menú. El nuevo se muestra una
              sola vez y el anterior deja de funcionar: actualízalo en todas las
              aplicaciones que usen ese cliente.
            </p>
            <p className="mt-2">
              Para un cliente nuevo, usa el secreto mostrado al guardar la conexión.
            </p>
          </details>
        </section>
      )}
      {!preview && legal && (
        <p className="text-xs text-muted-foreground">
          La aplicación y los documentos se administran en Console y Legal.
        </p>
      )}
      {envError && (
        <p role="alert" className="text-sm text-destructive">
          {envError}
        </p>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {status}
      </p>
      {!preview && (
        <details className="space-y-3 rounded-lg bg-muted/40 p-4">
          <summary className="cursor-pointer text-sm font-semibold">Cómo instalar la conexión</summary>
          <ol className="list-inside list-decimal space-y-3 text-sm">
            <li>
              Añade las variables descargadas al archivo <code>.env</code> o al
              panel de despliegue de tu backend.
            </li>
            <li>
              {remote ? (
                <>Instala <code>npm install @hemia/payments@^{connectionReference?.sdkVersion || "0.11.0"} @hemia/auth</code> desde npm y usa <code>resolvePaymentsConnection</code>. Consulta el ejemplo de inicialización.</>
              ) : payments ? (
                <>
                  Instala{" "}
                  <code>npm install @hemia/payments @hemia/auth</code>. Carga{" "}
                  <code>PAYMENTS_CONNECTION</code> como JSON y pasa el secreto
                  por separado al SDK.
                </>
              ) : legal ? (
                <>
                  Instala <code>npm install @hemia/auth</code> y usa las
                  variables de Identity y Legal del archivo.
                </>
              ) : (
                <>
                  Configura el cliente OAuth de tu backend con las variables de
                  Identity y los permisos de los servicios seleccionados.
                </>
              )}
            </li>
            {payments && receiver && (
              <li>
                Configura <code>createPaymentsReceiver</code> y la entrega de
                licencias con la persistencia de tu aplicación.
              </li>
            )}
            {selection?.legalAcceptances?.includes("collector") && (
              <li>
                Conserva en tu backend la sesión o el contexto de registro y
                entrega a Legal la aceptación explícita de los documentos
                seleccionados.
              </li>
            )}
            <li>
              Carga las variables antes de iniciar el SDK, reinicia el backend y
              pulsa <strong>Comprobar conexión</strong>.
            </li>
          </ol>
          {selection && !receiver && (
            <p className="text-xs text-muted-foreground">
              Las funciones seleccionadas no requieren un webhook de pagos ni un
              receptor local de licencias.
            </p>
          )}
          {payments && (
            <details className="text-sm">
              <summary className="cursor-pointer py-2 font-medium">
                Ejemplo de inicialización en Node.js
              </summary>
              <pre className="overflow-auto rounded-lg bg-background p-3 text-xs">
                <code>
                  {remote
                    ? `import { resolvePaymentsConnection, createPaymentsClient } from '@hemia/payments';\n\nconst connection = await resolvePaymentsConnection({\n  baseUrl: process.env.HEMIA_BASE_URL,\n  connectionCode: process.env.HEMIA_CONNECTION,\n  clientId: process.env.HEMIA_CLIENT_ID,\n  clientSecret: process.env.HEMIA_CLIENT_SECRET,\n  allowHttpLoopback: process.env.NODE_ENV !== 'production',\n});\n\nconst payments = createPaymentsClient({\n  ...connection,\n  clientSecret: process.env.HEMIA_CLIENT_SECRET,\n});`
                    : receiver &&
                  selection?.payments?.every((fn) => fn === "receiver")
                    ? `import { createPaymentsReceiver } from '@hemia/payments';\n\nconst receiver = createPaymentsReceiver({\n  ...JSON.parse(process.env.PAYMENTS_CONNECTION),\n  clientSecret: process.env.HEMIA_CLIENT_SECRET,\n}, { onSnapshot: (snapshot) => repository.applyIfNewer(snapshot) });`
                    : `import { createPaymentsClient } from '@hemia/payments';\n\nconst payments = createPaymentsClient({\n  ...JSON.parse(process.env.PAYMENTS_CONNECTION),\n  clientSecret: process.env.HEMIA_CLIENT_SECRET,\n});`}
                </code>
              </pre>
            </details>
          )}
        </details>
      )}
    </section>
  );
}

export function ConnectionDeliveryResult({
  result,
  selection,
  systemCode,
  oauthClient,
  onCheck,
  onConfigure,
}: {
  result: ConnectionResult;
  selection: Selection;
  systemCode?: string;
  oauthClient?: { name: string; href: string };
  onCheck: () => void;
  onConfigure: () => void;
}) {
  const preview = result.status === "preview";
  const services = [
    ...new Set(result.steps.map((step) => step.service || "Conexión")),
  ];
  return (
    <div aria-live="polite" className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          {preview
            ? "Entrega prevista · Sin guardar"
            : result.status === "pending"
              ? "Pendientes por resolver"
              : result.mode === "check"
                ? "Comprobación completada"
                : result.status === "verified"
                  ? "Conexión comprobada"
                  : "Configuración guardada"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {preview
            ? "Revisa el .env antes de guardar."
            : result.status === "pending"
              ? "Corrige los datos o instala la configuración indicada. Puedes continuar desde este resultado."
              : result.ready
                ? "La comprobación del backend confirmó la configuración instalada."
                : "Se confirmó la configuración en los servicios. La instalación del backend no se ha comprobado."}
        </p>
      </div>
      <details open={result.status === "pending"} className="space-y-3">
        <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-ring">
          {preview ? "Cambios al guardar" : "Estado de los servicios"}
        </summary>
        <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <section
            key={service}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <h4 className="text-sm font-semibold">{service}</h4>
            <ul className="space-y-3">
              {result.steps
                .filter((step) => (step.service || "Conexión") === service)
                .map((step) => (
                  <li key={step.name} className="flex gap-2 text-sm">
                    {!preview && step.state === "done" ? (
                      <CheckCircle2
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      {step.name}
                      <span className="block text-xs text-muted-foreground">
                        {preview
                          ? step.kind === "verification"
                            ? "Comprobación prevista"
                            : "Se guardará al confirmar"
                          : step.state === "done"
                            ? step.kind === "verification"
                              ? "Comprobado"
                              : "Configurado"
                            : "Pendiente"}
                      </span>
                      {step.message && (
                        <span className="mt-1 block text-muted-foreground">
                          {step.message}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      </details>
      {Object.keys(result.configuration).length > 0 && (
        <ConnectionConfigurationOutput
          configuration={result.connectionReference?.configuration || result.configuration}
          connectionReference={result.connectionReference}
          advancedConfiguration={result.connectionReference ? result.configuration : undefined}
          secretVariable={result.secretVariable}
          selection={selection}
          systemCode={systemCode}
          oauthClient={oauthClient}
          unsaved={preview}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onConfigure}>
          Corregir configuración
        </Button>
        <Button type="button" variant="outline" onClick={onCheck}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Comprobar conexión
        </Button>
      </div>
    </div>
  );
}
