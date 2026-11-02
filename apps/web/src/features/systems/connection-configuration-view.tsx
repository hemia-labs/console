import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/zuno/tooltip";

const descriptions: Record<string, [string, string]> = {
  HEMIA_BASE_URL: [
    "Dirección de Hemia",
    "Entrada de Billing para descubrir y cargar la configuración de esta conexión.",
  ],
  HEMIA_CONNECTION: [
    "Conexión",
    "Código de la conexión publicada por Console para este cliente y entorno.",
  ],
  HEMIA_IDENTITY_ISSUER: [
    "Emisor de Identity",
    "Se pasa como issuer al cliente OAuth. Console genera este nombre de variable; el SDK no lo lee automáticamente.",
  ],
  HEMIA_TOKEN_URL: [
    "Endpoint de tokens",
    "Se pasa como tokenUrl para solicitar los tokens de servicio.",
  ],
  HEMIA_CLIENT_ID: [
    "Cliente OAuth",
    "Se pasa como clientId. Identifica el cliente asociado a este sistema y entorno.",
  ],
  HEMIA_CLIENT_SECRET: [
    "Secreto del cliente OAuth",
    "Se entrega vacío. Complétalo en el backend con el secreto de este cliente.",
  ],
  PAYMENTS_CONNECTION: [
    "Conexión de Billing",
    "Objeto para @hemia/payments. Ya incluye issuer, tokenUrl y clientId; el secreto se pasa por separado.",
  ],
  LEGAL_API_BASE_URL: [
    "Dirección de Legal",
    "Dirección del servicio que proporciona los documentos y registra la evidencia.",
  ],
  LEGAL_API_AUDIENCE: [
    "Audiencia de Legal",
    "Identifica la API a la que se dirige el token OAuth.",
  ],
  LEGAL_SCOPES: [
    "Permisos de Legal",
    "Permisos técnicos de las funciones seleccionadas para esta conexión.",
  ],
};

function decoded(value: unknown) {
  if (typeof value !== "string") return value;
  if (/^\s*[\[{]/.test(value))
    try {
      return JSON.parse(value) as unknown;
    } catch {
      /* Show the exact value when it is not JSON. */
    }
  return value;
}

function ConfigurationValue({ value }: { value: unknown }) {
  const parsed = decoded(value);
  if (parsed !== null && typeof parsed === "object")
    return (
      <details className="rounded-lg border border-border bg-background p-3">
        <summary className="cursor-pointer text-xs font-medium">
          Ver contenido JSON
        </summary>
        <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-6 [overflow-wrap:anywhere]">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </details>
    );
  if (value === "")
    return (
      <p className="text-xs font-medium text-muted-foreground">
        Vacío · Completar en el backend
      </p>
    );
  return (
    <code className="block whitespace-pre-wrap break-words text-xs leading-6 [overflow-wrap:anywhere]">
      {String(value ?? "")}
    </code>
  );
}

export function ConfigurationReadView({
  configuration,
  secretVariable,
}: {
  configuration: Record<string, unknown>;
  secretVariable?: string;
}) {
  const entries = Object.entries({
    ...configuration,
    ...(secretVariable ? { [secretVariable]: "" } : {}),
  });
  const group = (key: string) =>
    key.startsWith("HEMIA_")
      ? "Identity y acceso"
      : key.startsWith("PAYMENTS_")
        ? "Billing"
        : key.startsWith("LEGAL_")
          ? "Legal"
          : "Otras variables";
  return (
    <div
      tabIndex={0}
      aria-label="Configuración generada"
      className="max-h-[36rem] space-y-5 overflow-y-auto bg-background p-4 focus-visible:outline-ring sm:p-5"
    >
      {Boolean(configuration.PAYMENTS_CONNECTION) && (
        <p className="rounded-lg bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
          PAYMENTS_CONNECTION contiene la conexión de Billing y los servicios
          integrados. Completa HEMIA_CLIENT_SECRET por separado.
        </p>
      )}
      {[...new Set(entries.map(([key]) => group(key)))].map((title) => (
        <section key={title} className="space-y-2" aria-label={title}>
          <h4 className="text-sm font-semibold">{title}</h4>
          <dl className="divide-y divide-border rounded-lg border border-border">
            {entries
              .filter(([key]) => group(key) === title)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <dt className="space-y-1">
                    <span className="block text-sm font-medium">
                      {descriptions[key]?.[0] || key}
                    </span>
                    <code className="block break-all text-xs text-primary">
                      {key}
                    </code>
                    {descriptions[key]?.[1] && (
                      <span className="block text-xs leading-5 text-muted-foreground">
                        {descriptions[key][1]}
                      </span>
                    )}
                  </dt>
                  <dd className="min-w-0 text-sm">
                    <ConfigurationValue value={value} />
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

const connectionFieldHelp: Record<string, string> = {
  issuer: "Servidor de Identity que autentica esta conexión.",
  tokenUrl: "Dirección de Identity para obtener los tokens de acceso.",
  clientId: "Cliente OAuth de tu aplicación. Su secreto se configura por separado.",
  baseUrl: "Dirección de la API de Billing para consultar planes y gestionar pagos.",
  resource: "Servicio de Billing para el que se solicita el token OAuth.",
  audience: "Identificador de la API de Billing que aceptará el token.",
  productCode: "Código del producto de tu aplicación en Billing.",
  receiver: "Valida las llamadas de Legal, Billing o Console a tu backend. Legal utiliza este bloque para verificar el contexto de tus usuarios.",
  "receiver.audience": "Identificador de tu API para validar las llamadas recibidas de Legal, Billing o Console.",
  "receiver.billingClientId": "Cliente de Billing autorizado para entregar licencias a tu backend.",
  "receiver.consoleClientId": "Cliente de Console autorizado para comprobar esta integración.",
  legal: "Conexión con Legal para gestionar documentos y evidencia de aceptación.",
  "legal.baseUrl": "Dirección de la API de Legal.",
  "legal.audience": "Identificador de la API de Legal que aceptará el token.",
  "legal.resource": "Servicio de Legal para el que se solicita el token OAuth.",
  "legal.verificationClientId": "Cliente de Legal autorizado para consultar el contexto de tus usuarios en el backend.",
  successUrl: "Página a la que vuelve el usuario al completar el pago.",
  cancelUrl: "Página a la que vuelve el usuario al cancelar el pago.",
  allowHttpLoopback: "Permite direcciones HTTP de localhost durante el desarrollo.",
};

function ConfigurationKey({ name, path = name, quoted = true }: {
  name: string;
  path?: string;
  quoted?: boolean;
}) {
  const text = quoted ? JSON.stringify(name) : name;
  const help = connectionFieldHelp[path] || descriptions[name]?.[1];
  if (!help) return <span>{text}</span>;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} />}
        className="cursor-help rounded-sm text-primary underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {text}
      </TooltipTrigger>
      <TooltipContent className="select-none whitespace-normal font-sans leading-5">
        {help}
      </TooltipContent>
    </Tooltip>
  );
}

function ConnectionProperties({ value, path = "" }: { value: object; path?: string }) {
  const entries = Object.entries(value);
  return (
    <>
      {entries.map(([key, nested], index) => {
        const comma = index < entries.length - 1 ? "," : "";
        const fieldPath = path ? `${path}.${key}` : key;
        if (!path && (key === "legal" || key === "receiver") && nested !== null &&
          typeof nested === "object" && !Array.isArray(nested))
          return (
            <details key={key} className="group/json ml-[2ch]">
              <summary className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
                <ConfigurationKey name={key} path={fieldPath} />{": {"}
                <span className="text-muted-foreground group-open/json:hidden">…{"}"}{comma}</span>
              </summary>
              <div>
                <ConnectionProperties value={nested} path={fieldPath} />
                {"}"}{comma}
              </div>
            </details>
          );
        return (
          <span key={key} className="block">
            {"  "}<ConfigurationKey name={key} path={fieldPath} />
            {JSON.stringify({ [key]: nested }, null, 2).slice(4 + JSON.stringify(key).length, -2)}{comma}
          </span>
        );
      })}
    </>
  );
}

function EnvironmentValue({ name, raw }: { name: string; raw: string }) {
  if (name !== "PAYMENTS_CONNECTION") return raw;
  const quote = ["'", '"', "`"].find(
    (q) => raw.startsWith(q) && raw.endsWith(q),
  ) || "";
  const value = decoded(quote ? raw.slice(1, -1) : raw);
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return raw;
  return <>{quote}{"{\n"}<ConnectionProperties value={value} />{"}"}{quote}</>;
}

export function ConfigurationFileView({
  content,
  env,
}: {
  content: string;
  env: boolean;
}) {
  return (
    <div
      tabIndex={0}
      aria-label="Configuración generada"
      className="max-h-[36rem] overflow-y-auto bg-background py-4 font-mono text-xs leading-6 text-foreground focus-visible:outline-ring"
    >
        {content.split("\n").map((line, index) => {
          const equals = env && !line.startsWith("#") ? line.indexOf("=") : -1;
          return (
            <div
              key={index}
              className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 pr-4 hover:bg-muted/30"
            >
              <span
                aria-hidden="true"
                className="select-none border-r border-border pr-3 text-right text-muted-foreground"
              >
                {index + 1}
              </span>
              <div
                className={`min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${line.startsWith("#") && env ? "text-muted-foreground" : ""}`}
              >
                {equals >= 0 ? (
                  <>
                    <ConfigurationKey name={line.slice(0, equals)} quoted={false} />
                    <span className="text-muted-foreground">=</span>
                    <EnvironmentValue name={line.slice(0, equals)} raw={line.slice(equals + 1)} />
                  </>
                ) : (
                  line || "\n"
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
