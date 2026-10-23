"use client";
import { CapabilityFunctionsForm } from "./capability-functions-form";
import type { OAuthScope } from "@/features/oauth-scopes/types";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  Braces,
  ChevronRight,
  Code2,
  Info,
  ListChecks,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/zuno/badge";
import { Card } from "@/components/zuno/card";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Field, Choice, textareaClass } from "./catalog-fields";
import {
  capabilityFieldTypes,
  readSchema,
  type Capability,
  type CapabilityField,
} from "./types";
export function CapabilityForm({
  capability,
  onSave,
  cancelHref,
  scopes = [],
  scopesHref,
}: {
  capability?: Capability;
  onSave: (v: Capability) => Promise<void>;
  cancelHref: string;
  scopes?: OAuthScope[];
  scopesHref?: string;
}) {
  const [value, setValue] = useState<Capability>(
    () =>
      capability ?? {
        code: "",
        name: "",
        schema: { fields: [] },
        functions: [],
      },
  );
  const [json, setJson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  function field(index: number, next: Partial<CapabilityField>) {
    setValue((v) => ({
      ...v,
      schema: {
        fields: v.schema.fields.map((f, i) =>
          i === index ? { ...f, ...next } : f,
        ),
      },
    }));
  }
  function addField() {
    const index = value.schema.fields.length;
    setValue((v) => ({
      ...v,
      schema: {
        fields: [...v.schema.fields, { key: "", label: "", type: "string" }],
      },
    }));
    requestAnimationFrame(() =>
      document.getElementById(`field-${index}-label`)?.focus(),
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    try {
      setError("");
      const schema = json === null ? value.schema : readSchema(json);
      const functions = new Set((value.functions ?? []).map((fn) => fn.code));
      if (
        schema.fields.some((f) =>
          f.functions?.some((code) => !functions.has(code)),
        )
      )
        throw new Error(
          "Hay campos asociados a funciones retiradas. Revisa Mostrar para funciones antes de guardar.",
        );
      submitting.current = true;
      setSaving(true);
      await onSave({ ...value, schema });
    } catch (cause) {
      setError(
        cause instanceof SyntaxError
          ? "El JSON no es válido. Revisa su formato antes de continuar."
          : cause instanceof Error
            ? cause.message
            : "No se pudo guardar el esquema.",
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-6"
      aria-busy={saving}
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        <legend className="sr-only">Configuración de la capacidad</legend>
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-heading">
              Datos generales
            </h2>
            <p className="text-sm text-muted-foreground">
              Identifica la capacidad que podrán utilizar los sistemas.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="capability-name" label="Nombre">
              <Input
                id="capability-name"
                className="h-10"
                autoFocus
                placeholder="p. ej. Notificaciones"
                required
                maxLength={200}
                value={value.name}
                onChange={(e) =>
                  setValue((v) => ({ ...v, name: e.target.value }))
                }
              />
            </Field>
            <Field
              id="capability-code"
              label="Código"
              help={
                capability
                  ? "Identificador fijo. No se puede modificar después de crear la capacidad."
                  : "Usa letras sin espacios. Por ejemplo: notifications."
              }
            >
              <Input
                id="capability-code"
                className="h-10 font-mono read-only:bg-muted/50 read-only:text-muted-foreground"
                aria-describedby="capability-code-help"
                placeholder="notifications"
                required
                readOnly={Boolean(capability)}
                pattern="[a-z][a-zA-Z0-9_]{1,79}"
                maxLength={80}
                value={value.code}
                onChange={(e) =>
                  setValue((v) => ({ ...v, code: e.target.value }))
                }
              />
            </Field>
          </div>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-base font-semibold text-heading">
                <ListChecks
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Campos del formulario
              </h2>
              <p className="text-sm text-muted-foreground">
                {value.schema.fields.length} de 50 campos · Define qué
                información pedirá esta capacidad.
              </p>
            </div>
            {json === null && (
              <Button
                className="min-h-10 shrink-0"
                type="button"
                variant="outline"
                disabled={value.schema.fields.length >= 50}
                onClick={addField}
              >
                <Plus className="size-4" aria-hidden="true" />
                Agregar campo
              </Button>
            )}
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div
              role="group"
              aria-label="Vista del esquema"
              className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1"
            >
              <Button
                type="button"
                variant="ghost"
                aria-pressed={json === null}
                className={
                  json === null
                    ? "min-h-10 bg-card shadow-xs"
                    : "min-h-10 text-muted-foreground"
                }
                onClick={() => {
                  try {
                    if (json !== null) {
                      const schema = readSchema(json);
                      setValue((v) => ({ ...v, schema }));
                    }
                    setJson(null);
                    setError("");
                  } catch (cause) {
                    setError(
                      cause instanceof SyntaxError
                        ? "El JSON no es válido. Revisa su formato antes de continuar."
                        : cause instanceof Error
                          ? cause.message
                          : "JSON inválido.",
                    );
                  }
                }}
              >
                <ListChecks className="size-4" aria-hidden="true" />
                Campos del formulario
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-pressed={json !== null}
                className={
                  json !== null
                    ? "min-h-10 bg-card shadow-xs"
                    : "min-h-10 text-muted-foreground"
                }
                onClick={() => {
                  if (json === null)
                    setJson(JSON.stringify(value.schema, null, 2));
                }}
              >
                <Code2 className="size-4" aria-hidden="true" />
                JSON avanzado
              </Button>
            </div>
            {json !== null ? (
              <Field
                id="capability-json"
                label="Esquema JSON"
                help="Esta vista edita los mismos campos del formulario. Se aplican las mismas validaciones al guardar."
              >
                <textarea
                  id="capability-json"
                  className={`${textareaClass} min-h-96 resize-y text-xs leading-6 sm:text-sm`}
                  aria-describedby="capability-json-help"
                  spellCheck={false}
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  maxLength={50000}
                />
              </Field>
            ) : (
              <div className="space-y-4">
                {value.schema.fields.map((f, index) => (
                  <fieldset
                    key={index}
                    className="min-w-0 space-y-5 rounded-lg border border-border p-4 sm:p-5"
                  >
                    <legend className="sr-only">Campo {index + 1}</legend>
                    <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-medium text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <h3 className="break-words text-sm font-semibold">
                            {f.label || `Campo ${index + 1}`}
                          </h3>
                          <p className="break-all font-mono text-xs text-muted-foreground">
                            {f.key || "Sin clave"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex"
                        >
                          {f.options?.length
                            ? "Selección"
                            : capabilityFieldTypes.find(
                                (type) => type.value === f.type,
                              )?.label}
                        </Badge>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Quitar campo ${index + 1}`}
                          title="Quitar campo"
                          disabled={value.schema.fields.length === 1}
                          onClick={() =>
                            setValue((v) => ({
                              ...v,
                              schema: {
                                fields: v.schema.fields.filter(
                                  (_, i) => i !== index,
                                ),
                              },
                            }))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field id={`field-${index}-label`} label="Etiqueta">
                        <Input
                          className="h-10"
                          id={`field-${index}-label`}
                          required
                          maxLength={120}
                          value={f.label}
                          onChange={(e) =>
                            field(index, { label: e.target.value })
                          }
                        />
                      </Field>
                      <Field id={`field-${index}-key`} label="Clave">
                        <Input
                          className="h-10"
                          id={`field-${index}-key`}
                          required
                          pattern="[a-z][a-zA-Z0-9_]{1,79}"
                          maxLength={80}
                          value={f.key}
                          onChange={(e) =>
                            field(index, { key: e.target.value })
                          }
                        />
                      </Field>
                      <Field id={`field-${index}-type`} label="Tipo">
                        <Choice
                          id={`field-${index}-type`}
                          value={f.type}
                          onChange={(type) => {
                            const fields = [...value.schema.fields];
                            fields[index] = {
                              key: f.key,
                              label: f.label,
                              required: f.required,
                              functions: f.functions,
                              description: f.description,
                              type: type as CapabilityField["type"],
                            };
                            setValue((v) => ({ ...v, schema: { fields } }));
                          }}
                          options={[...capabilityFieldTypes]}
                        />
                      </Field>
                    </div>
                    <label className="flex min-h-10 w-fit cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        checked={Boolean(f.required)}
                        onChange={(e) =>
                          field(index, { required: e.target.checked })
                        }
                      />
                      Campo obligatorio
                    </label>
                    <fieldset className="space-y-2 rounded-lg border border-border p-3">
                      <legend className="px-1 text-sm font-medium">
                        Mostrar para funciones
                      </legend>
                      <p className="text-xs text-muted-foreground">
                        Sin selección se aplica a todas las funciones. Si es
                        obligatorio, se exige únicamente en las seleccionadas.
                      </p>
                      {(value.functions ?? []).map((fn) => (
                        <label
                          key={fn.code}
                          className="flex min-h-10 items-center gap-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={f.functions?.includes(fn.code) ?? false}
                            onChange={(e) => {
                              const selected = e.target.checked
                                ? [...(f.functions ?? []), fn.code]
                                : (f.functions ?? []).filter(
                                    (code) => code !== fn.code,
                                  );
                              field(index, {
                                functions: selected.length
                                  ? selected
                                  : undefined,
                              });
                            }}
                          />
                          {fn.name || fn.code}
                        </label>
                      ))}
                      {f.functions
                        ?.filter(
                          (code) =>
                            !(value.functions ?? []).some(
                              (fn) => fn.code === code,
                            ),
                        )
                        .map((code) => (
                          <label
                            key={code}
                            className="flex min-h-10 items-center gap-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked
                              onChange={() => {
                                const selected = f.functions?.filter(
                                  (item) => item !== code,
                                );
                                field(index, {
                                  functions: selected?.length
                                    ? selected
                                    : undefined,
                                });
                              }}
                            />
                            {code} (función retirada; desmarca para corregir)
                          </label>
                        ))}
                      {!value.functions?.length && (
                        <p className="text-xs text-muted-foreground">
                          Agrega funciones a la capacidad para elegir a cuáles
                          aplica este campo.
                        </p>
                      )}
                    </fieldset>
                    <Field id={`field-${index}-description`} label="Ayuda">
                      <Input
                        className="h-10"
                        id={`field-${index}-description`}
                        maxLength={500}
                        value={f.description ?? ""}
                        onChange={(e) =>
                          field(index, { description: e.target.value })
                        }
                      />
                    </Field>
                    {f.type !== "boolean" && (
                      <details className="group rounded-lg border border-border bg-muted/20">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                          <SlidersHorizontal
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          Validaciones y opciones
                          <ChevronRight
                            className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="space-y-4 border-t border-border p-4">
                          {f.type === "string" && (
                            <div className="grid gap-4 md:grid-cols-3">
                              <Field
                                id={`field-${index}-format`}
                                label="Formato"
                              >
                                <Choice
                                  id={`field-${index}-format`}
                                  value={f.format ?? "text"}
                                  onChange={(format) =>
                                    field(index, {
                                      format:
                                        format as CapabilityField["format"],
                                      ...(format === "service"
                                        ? { options: undefined, maxLength: 80 }
                                        : {}),
                                    })
                                  }
                                  options={[
                                    { value: "text", label: "Texto" },
                                    { value: "uri", label: "URL" },
                                    {
                                      value: "service",
                                      label: "Servicio del sistema",
                                    },
                                    { value: "uuid", label: "UUID" },
                                    { value: "code", label: "Código" },
                                    {
                                      value: "identity-issuer",
                                      label: "Identidad de origen",
                                    },
                                  ]}
                                />
                              </Field>
                              <Field
                                id={`field-${index}-length`}
                                label="Longitud máxima"
                              >
                                <Input
                                  className="h-10"
                                  id={`field-${index}-length`}
                                  type="number"
                                  min={1}
                                  max={10000}
                                  value={f.maxLength ?? ""}
                                  onChange={(e) =>
                                    field(index, {
                                      maxLength: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    })
                                  }
                                />
                              </Field>
                              <Field
                                id={`field-${index}-options`}
                                label="Opciones"
                                help="Separadas por comas. Con opciones se mostrará un selector."
                              >
                                <Input
                                  className="h-10"
                                  id={`field-${index}-options`}
                                  disabled={f.format === "service"}
                                  aria-describedby={`field-${index}-options-help`}
                                  placeholder="p. ej. prueba, producción"
                                  value={f.options?.join(", ") ?? ""}
                                  onChange={(e) =>
                                    field(index, {
                                      options: e.target.value
                                        ? e.target.value
                                            .split(",")
                                            .map((v) => v.trim())
                                        : undefined,
                                    })
                                  }
                                />
                              </Field>
                            </div>
                          )}
                          {(f.type === "number" || f.type === "integer") && (
                            <div className="grid gap-4 md:grid-cols-2">
                              {(["min", "max"] as const).map((bound) => (
                                <Field
                                  key={bound}
                                  id={`field-${index}-${bound}`}
                                  label={bound === "min" ? "Mínimo" : "Máximo"}
                                >
                                  <Input
                                    className="h-10"
                                    id={`field-${index}-${bound}`}
                                    type="number"
                                    step={f.type === "integer" ? 1 : "any"}
                                    value={f[bound] ?? ""}
                                    onChange={(e) =>
                                      field(index, {
                                        [bound]: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      })
                                    }
                                  />
                                </Field>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </fieldset>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-start gap-3 border-t border-border bg-muted/30 p-5 text-sm text-muted-foreground sm:px-6">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Al guardar se comprueba que los sistemas existentes sigan siendo
              válidos con este esquema.
            </p>
          </div>
        </Card>
        <CapabilityFunctionsForm
          functions={value.functions ?? []}
          scopes={scopes}
          scopesHref={scopesHref}
          disabled={saving}
          onChange={(functions) =>
            setValue((current) => ({ ...current, functions }))
          }
        />
      </fieldset>
      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Braces className="size-4 shrink-0" aria-hidden="true" />
          El esquema se aplica a los sistemas que usan esta capacidad.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={saving}
            render={<Link href={cancelHref} />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="min-h-10"
            loading={saving}
            disabled={saving}
          >
            Guardar capacidad
          </Button>
        </div>
      </div>
    </form>
  );
}
