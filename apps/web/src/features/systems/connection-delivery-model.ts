export type ConnectionResult = {
  ready: boolean;
  status: "preview" | "configured" | "verified" | "pending";
  mode?: "save" | "preview" | "check";
  steps: {
    name: string;
    state: "done" | "pending";
    message?: string;
    service?: string;
    kind?: "configuration" | "verification";
  }[];
  configuration: Record<string, string>;
  secretVariable?: string;
  connectionReference?: {
    configuration: Record<string, string>;
    published: boolean;
    sdkVersion: string;
  };
};

export function connectionEnv(
  configuration: Record<string, unknown>,
  secretVariable?: string,
) {
  const values = {
    ...configuration,
    ...(secretVariable ? { [secretVariable]: "" } : {}),
  };
  return (
    "# Configuración del backend generada por Hemia Console\n" +
    (secretVariable
      ? `# ${secretVariable}: usa el secreto del backend o del gestor de secretos del entorno.\n` +
        "# Si lo perdiste: Identity > Clientes OAuth > abre el cliente > Rotar secreto.\n" +
        "# Rotarlo invalida el anterior: actualiza todas las aplicaciones que usen ese cliente.\n"
      : "") +
    Object.entries(values)
      .map(([key, raw]) => {
        if (!/^[A-Z_][A-Z0-9_]*$/.test(key))
          throw new Error(
            "La configuración no tiene formato de variables de entorno. Usa JSON.",
          );
        const value = typeof raw === "string" ? raw : JSON.stringify(raw);
        if (value === undefined)
          throw new Error("Hay un valor sin definir. Revisa la configuración.");
        const quote = ["'", "`"].find((q) => !value.includes(q));
        if (quote) return `${key}=${quote}${value}${quote}`;
        if (!/[#\r\n]/.test(value)) return `${key}=${value}`;
        throw new Error(
          `El valor de ${key} requiere el formato JSON. Copia la configuración JSON.`,
        );
      })
      .join("\n") +
    "\n"
  );
}
