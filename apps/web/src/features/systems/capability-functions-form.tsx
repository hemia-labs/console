"use client";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Card } from "@/components/zuno/card";
import { ScopePicker } from "@/features/oauth-scopes/scope-picker";
import type { ApiScope } from "@/features/oauth-scopes/types";
import { Field } from "./catalog-fields";
import type { CapabilityFunction } from "./types";
export function CapabilityFunctionsForm({
  functions,
  scopes,
  onChange,
  disabled = false,
  scopesHref,
}: {
  functions: CapabilityFunction[];
  scopes: ApiScope[];
  onChange: (value: CapabilityFunction[]) => void;
  disabled?: boolean;
  scopesHref?: string;
}) {
  function change(index: number, next: Partial<CapabilityFunction>) {
    onChange(functions.map((fn, i) => (i === index ? { ...fn, ...next } : fn)));
  }
  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Funciones y permisos</h2>
          <p className="text-sm text-muted-foreground">
            Cada función define los permisos que recibirá su cliente de
            Identity.
          </p>
        </div>
        <Button
          className="min-h-10"
          type="button"
          variant="outline"
          disabled={disabled || functions.length >= 30}
          onClick={() =>
            onChange([...functions, { code: "", name: "", scopes: [] }])
          }
        >
          <Plus className="size-4" />
          Agregar función
        </Button>
      </div>
      {scopesHref && (
        <Link
          href={scopesHref}
          className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4"
        >
          Administrar catálogo de scopes
        </Link>
      )}
      {!functions.length && (
        <p className="text-sm text-muted-foreground">
          Esta capacidad todavía no define funciones para clientes.
        </p>
      )}
      {functions.map((fn, index) => (
        <fieldset
          key={index}
          disabled={disabled}
          className="min-w-0 space-y-4 rounded-lg border border-border p-4"
        >
          <legend className="px-2 text-sm font-medium">
            Función {index + 1}
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id={`function-${index}-name`} label="Nombre">
              <Input
                id={`function-${index}-name`}
                required
                maxLength={200}
                className="h-10"
                value={fn.name}
                onChange={(e) => change(index, { name: e.target.value })}
              />
            </Field>
            <Field id={`function-${index}-code`} label="Código">
              <Input
                id={`function-${index}-code`}
                required
                maxLength={80}
                pattern="[a-z][a-z0-9_-]{1,79}"
                className="h-10"
                value={fn.code}
                onChange={(e) => change(index, { code: e.target.value })}
              />
            </Field>
          </div>
          <Field id={`function-${index}-scopes`} label="Permisos de la función">
            <ScopePicker
              id={`function-${index}-scopes`}
              scopes={scopes}
              requireResource
              value={fn.scopes}
              onChange={(references) => change(index, { scopes: references })}
              disabled={disabled}
            />
          </Field>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className="min-h-10 text-destructive"
            onClick={() => onChange(functions.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
            Eliminar función
          </Button>
        </fieldset>
      ))}
    </Card>
  );
}
