"use client";
import { Plus, Server, Trash2 } from "lucide-react";
import { Card } from "@/components/zuno/card";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Switch } from "@/components/zuno/switch";
import { Field, Choice } from "./catalog-fields";
import { verificationResource, type SystemService } from "./types";

export function SystemServicesForm({
  services,
  audiences,
  usage,
  onChange,
  onAddService,
  disabled = false,
}: {
  services: SystemService[];
  audiences: string[];
  onAddService: () => void;
  disabled?: boolean;
  usage: Record<string, string[]>;
  onChange: (services: SystemService[]) => void;
}) {
  function change(index: number, next: Partial<SystemService>) {
    onChange(
      services.map((service, i) =>
        i === index ? { ...service, ...next } : service,
      ),
    );
  }
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold text-heading">
            <Server
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Servicios del sistema
          </h2>
          <p className="text-sm text-muted-foreground">
            Registra las direcciones que podrán seleccionar las capacidades de
            este sistema.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-10 shrink-0"
          disabled={disabled || services.length >= 100}
          onClick={onAddService}
        >
          <Plus className="size-4" aria-hidden="true" />
          Agregar servicio
        </Button>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {!services.length && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aún no hay servicios. Agrega uno si alguna capacidad necesita
            conectarse a este sistema.
          </p>
        )}
        {services.map((service, index) => {
          const usedBy = usage[service.code] ?? [];
          return (
            <fieldset
              key={index}
              className="min-w-0 space-y-4 rounded-lg border border-border p-4 sm:p-5"
            >
              <legend className="px-2 text-sm font-semibold">
                Servicio {index + 1}
              </legend>
              <div className="grid gap-5 md:grid-cols-2">
                <Field id={`service-${index}-name`} label="Nombre">
                  <Input
                    id={`service-${index}-name`}
                    className="h-10"
                    value={service.name}
                    required
                    maxLength={200}
                    placeholder="Nombre del servicio"
                    onChange={(e) => change(index, { name: e.target.value })}
                  />
                </Field>
                <Field
                  id={`service-${index}-code`}
                  label="Código"
                  help={
                    usedBy.length
                      ? "Se conserva mientras una capacidad lo utilice."
                      : "Identificador para seleccionarlo desde las capacidades."
                  }
                >
                  <Input
                    id={`service-${index}-code`}
                    aria-describedby={`service-${index}-code-help`}
                    className="h-10 font-mono"
                    value={service.code}
                    readOnly={usedBy.length > 0}
                    required
                    pattern="[a-z][a-z0-9_-]{1,79}"
                    maxLength={80}
                    placeholder="codigo_del_servicio"
                    onChange={(e) => change(index, { code: e.target.value })}
                  />
                </Field>
              </div>
              <Field
                id={`service-${index}-url`}
                label="URL del servicio"
                help="Dirección completa del endpoint. Usa HTTPS; HTTP local está disponible en desarrollo."
              >
                <Input
                  id={`service-${index}-url`}
                  aria-describedby={`service-${index}-url-help`}
                  className="h-10"
                  type="url"
                  value={service.url}
                  required
                  maxLength={2048}
                  placeholder="https://sistema.ejemplo/api/servicio"
                  onChange={(e) =>
                    change(index, {
                      url: e.target.value,
                      resource: verificationResource(e.target.value),
                    })
                  }
                />
              </Field>
              <Field
                id={`service-${index}-audience`}
                label="API receptora"
                help="Selecciona la API registrada en el catálogo de permisos. El destino se autoriza al guardar."
              >
                <Choice
                  id={`service-${index}-audience`}
                  value={service.audience}
                  options={audiences.map((audience) => ({
                    value: audience,
                    label: audience,
                  }))}
                  onChange={(audience) => change(index, { audience })}
                  disabled={disabled}
                />
              </Field>
              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <label
                  htmlFor={`service-${index}-enabled`}
                  className="flex items-center gap-3 text-sm font-medium"
                >
                  <Switch
                    id={`service-${index}-enabled`}
                    checked={service.enabled}
                    disabled={disabled || usedBy.length > 0}
                    aria-describedby={
                      usedBy.length ? `service-${index}-usage` : undefined
                    }
                    onCheckedChange={(enabled) => change(index, { enabled })}
                  />
                  Habilitado
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-10 text-muted-foreground hover:text-destructive"
                  aria-label={`Eliminar servicio ${service.name || index + 1}`}
                  disabled={disabled || usedBy.length > 0}
                  aria-describedby={
                    usedBy.length ? `service-${index}-usage` : undefined
                  }
                  onClick={() =>
                    onChange(services.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              {usedBy.length > 0 && (
                <p
                  id={`service-${index}-usage`}
                  className="text-xs text-muted-foreground"
                >
                  En uso por: {usedBy.join(", ")}. Selecciona otro servicio en
                  esas capacidades antes de eliminarlo o deshabilitarlo.
                </p>
              )}
            </fieldset>
          );
        })}
      </div>
    </Card>
  );
}
