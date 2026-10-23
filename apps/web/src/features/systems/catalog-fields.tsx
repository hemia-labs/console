"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/zuno/button";
import type { ReactNode } from "react";
import { Input } from "@/components/zuno/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/zuno/select";
import {
  verificationResource,
  type CapabilityField,
  type SystemService,
} from "./types";
export function Field({
  id,
  label,
  help,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block break-words text-sm font-medium">
        {label}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}
export function Choice({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción",
  disabled = false,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(v) => onChange(v ?? "")}
      disabled={disabled}
      items={options}
    >
      <SelectTrigger id={id} className="h-10" aria-describedby={describedBy}>
        <SelectValue className="min-w-0 truncate" placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function ConfigurationField({
  id,
  field,
  value,
  onChange,
  services,
  onAddService,
  addServiceDisabled = false,
}: {
  id: string;
  field: CapabilityField;
  value: unknown;
  onChange: (v: unknown) => void;
  services?: SystemService[];
  onAddService?: () => void;
  addServiceDisabled?: boolean;
}) {
  const choices = field.options;
  const available = (services ?? []).filter(
    (service) =>
      service.enabled &&
      /^[a-z][a-z0-9_-]{1,79}$/.test(service.code) &&
      service.name.trim() &&
      verificationResource(service.url),
  );
  const serviceOptions = available.map((service) => ({
    value: service.code,
    label: service.name || service.code,
  }));
  if (
    field.format === "service" &&
    typeof value === "string" &&
    value &&
    !available.some((service) => service.code === value)
  )
    serviceOptions.push({ value, label: `${value} (no disponible)` });
  return (
    <Field
      id={id}
      label={`${field.label}${field.required ? " *" : ""}`}
      help={field.format === "service" ? undefined : field.description}
    >
      {field.format === "service" ? (
        <div className="space-y-2">
          <Choice
            id={id}
            value={typeof value === "string" ? value : ""}
            describedBy={`${id}-help`}
            placeholder={
              available.length
                ? "Selecciona un servicio"
                : "Sin servicios disponibles"
            }
            disabled={!serviceOptions.length}
            onChange={onChange}
            options={
              field.required
                ? serviceOptions
                : [{ value: "", label: "Sin servicio" }, ...serviceOptions]
            }
          />
          <p id={`${id}-help`} className="text-xs text-muted-foreground">
            {field.description && `${field.description} `}
            {available.length
              ? "Selecciona uno de los servicios habilitados de este sistema."
              : "Completa nombre, código y URL de un servicio habilitado para seleccionarlo aquí."}
          </p>
          {onAddService && (
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={addServiceDisabled}
              onClick={onAddService}
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar servicio
            </Button>
          )}
        </div>
      ) : field.type === "boolean" ? (
        <div className="flex min-h-10 items-center">
          <input
            id={id}
            type="checkbox"
            aria-describedby={field.description ? `${id}-help` : undefined}
            className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
        </div>
      ) : choices ? (
        <Choice
          id={id}
          describedBy={field.description ? `${id}-help` : undefined}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          options={choices.map((v) => ({ value: v, label: v }))}
        />
      ) : (
        <Input
          id={id}
          className="h-10"
          type={
            field.type === "string"
              ? field.format === "uri"
                ? "url"
                : "text"
              : "number"
          }
          value={
            typeof value === "string" || typeof value === "number" ? value : ""
          }
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.type === "integer" ? 1 : "any"}
          maxLength={field.maxLength ?? 1024}
          onChange={(e) =>
            onChange(
              field.type === "string"
                ? e.target.value
                : e.target.value === ""
                  ? undefined
                  : Number(e.target.value),
            )
          }
          aria-describedby={field.description ? `${id}-help` : undefined}
        />
      )}
    </Field>
  );
}
export const textareaClass =
  "min-h-48 w-full rounded-lg border border-input bg-background p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
