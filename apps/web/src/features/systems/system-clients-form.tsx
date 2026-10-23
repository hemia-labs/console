"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { Card } from "@/components/zuno/card";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Switch } from "@/components/zuno/switch";
import { OneTimeSecretPanel } from "@/features/identity-access/oauth-clients/one-time-secret-panel";
import type { OneTimeOAuthSecret } from "@/features/identity-access/oauth-clients/types";
import { Field, Choice } from "./catalog-fields";
import {
  type Capability,
  type CatalogChoices,
  type SystemClient,
  type SystemDraft,
} from "./types";
import { createCapabilityClient } from "./systems-api";
export function SystemClientsForm({
  clients,
  capabilities,
  configuration,
  choices,
  systemCode,
  disabled = false,
  identityClientsHref,
  onChange,
  onBusyChange,
  onSecretPending,
}: {
  clients: SystemClient[];
  capabilities: Capability[];
  configuration: SystemDraft["configuration"];
  choices: CatalogChoices;
  systemCode: string;
  disabled?: boolean;
  identityClientsHref?: string;
  onChange: (clients: SystemClient[]) => void;
  onBusyChange: (busy: boolean) => void;
  onSecretPending: (pending: boolean) => void;
}) {
  const [directory, setDirectory] = useState(choices.clients);
  const [creatingFor, setCreatingFor] = useState<number | null>(null);
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);
  const submitting = useRef(false);
  const locked = disabled || !!secret;
  const active = capabilities.filter(
    (cap) =>
      Object.hasOwn(configuration, cap.code) &&
      (cap.functions?.length ?? 0) > 0,
  );
  function change(index: number, next: Partial<SystemClient>) {
    onChange(
      clients.map((binding, i) =>
        i === index ? { ...binding, ...next } : binding,
      ),
    );
    setCreatingFor(null);
    setError("");
  }
  async function create(index: number) {
    if (submitting.current || secret) return;
    const binding = clients[index];
    submitting.current = true;
    setPending(true);
    onBusyChange(true);
    setError("");
    try {
      const result = await createCapabilityClient(
        binding.capabilityCode,
        binding.roles,
        clientId.trim(),
      );
      setDirectory((current) => [
        ...current.filter(
          (c) =>
            c.clientId !== result.client.clientId ||
            c.oauthIssuer !== result.client.oauthIssuer,
        ),
        result.client,
      ]);
      onChange(
        clients.map((current, i) =>
          i === index
            ? {
                ...current,
                clientId: result.client.clientId,
                oauthIssuer: result.client.oauthIssuer,
              }
            : current,
        ),
      );
      setSecret({
        title: "Cliente de Identity creado",
        clientId: result.client.clientId,
        clientSecret: result.clientSecret,
        type: "confidential",
        status: "active",
        audience: result.client.serviceDestinations?.[0]?.audience,
      });
      onSecretPending(true);
      setCreatingFor(null);
      setClientId("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo crear el cliente.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
      onBusyChange(false);
    }
  }
  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="size-4" />
            Clientes del sistema
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecciona una capacidad y sus funciones. Sus permisos se obtienen
            del catálogo de Identity.
          </p>
        </div>
        <Button
          className="min-h-10"
          variant="outline"
          type="button"
          disabled={locked || clients.length >= 100 || !active.length}
          onClick={() =>
            onChange([
              ...clients,
              {
                capabilityCode: "",
                roles: [],
                oauthIssuer: "",
                clientId: "",
                enabled: true,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Agregar cliente
        </Button>
      </div>
      {identityClientsHref && (
        <Link
          href={identityClientsHref}
          className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4"
        >
          Administrar clientes en Identity
        </Link>
      )}
      {!active.length && (
        <p role="status" className="text-sm text-muted-foreground">
          Activa una capacidad que tenga funciones y permisos definidos para
          agregar clientes.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {secret && (
        <OneTimeSecretPanel
          secret={secret}
          onDismiss={() => {
            setSecret(null);
            onSecretPending(false);
          }}
        />
      )}
      {clients.map((binding, index) => {
        const capability = capabilities.find(
          (c) => c.code === binding.capabilityCode,
        );
        const functions = (capability?.functions ?? []).filter((f) =>
          binding.roles.includes(f.code),
        );
        const fn = functions.length
          ? { scopes: functions.flatMap((f) => f.scopes) }
          : undefined;
        const capOptions = active.map((c) => ({
          value: c.code,
          label: c.name,
        }));
        if (capability && !capOptions.some((c) => c.value === capability.code))
          capOptions.push({
            value: capability.code,
            label: `${capability.name} (desactivada)`,
          });
        const eligible = directory.filter(
          (c) =>
            c.clientId === binding.clientId ||
            !clients.some(
              (other) =>
                other.clientId === c.clientId &&
                other.oauthIssuer === c.oauthIssuer &&
                other.capabilityCode === binding.capabilityCode,
            ),
        );
        const options = eligible.map((c) => ({
          value: c.clientId,
          label:
            c.name && c.name !== c.clientId
              ? `${c.name} · ${c.clientId}`
              : c.clientId,
        }));
        if (
          binding.clientId &&
          !options.some((c) => c.value === binding.clientId)
        )
          options.push({
            value: binding.clientId,
            label: `Cliente registrado · ${binding.clientId}`,
          });
        const missingPermission = fn?.scopes.some(
          (ref) =>
            !choices.scopes.some(
              (s) =>
                s.enabled &&
                s.resource &&
                s.audience === ref.audience &&
                s.code === ref.code,
            ),
        );
        return (
          <fieldset
            key={index}
            disabled={locked}
            className="min-w-0 space-y-4 rounded-lg border border-border p-4"
          >
            <legend className="px-2 text-sm font-semibold">
              Cliente {index + 1}
            </legend>
            <div className="flex justify-end">
              <Button
                className="size-10"
                type="button"
                variant="ghost"
                disabled={locked}
                aria-label={`Quitar cliente ${index + 1}`}
                onClick={() => {
                  onChange(clients.filter((_, i) => i !== index));
                  setCreatingFor(null);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id={`client-capability-${index}`} label="Capacidad">
                <Choice
                  id={`client-capability-${index}`}
                  value={binding.capabilityCode}
                  options={capOptions}
                  disabled={locked}
                  placeholder="Selecciona una capacidad"
                  onChange={(capabilityCode) =>
                    change(index, {
                      capabilityCode,
                      roles: [],
                      clientId: "",
                      oauthIssuer: "",
                    })
                  }
                />
              </Field>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Funciones</legend>
                {(capability?.functions ?? []).map((f) => (
                  <label
                    key={f.code}
                    className="flex min-h-10 items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={binding.roles.includes(f.code)}
                      disabled={locked}
                      onChange={(event) =>
                        change(index, {
                          roles: event.target.checked
                            ? [...binding.roles, f.code]
                            : binding.roles.filter((role) => role !== f.code),
                        })
                      }
                    />
                    {f.name}
                  </label>
                ))}
              </fieldset>
            </div>
            {fn && (
              <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                <h3 className="text-sm font-medium">
                  Permisos de esta función
                </h3>
                <ul className="space-y-1">
                  {fn.scopes.map((ref) => {
                    const scope = choices.scopes.find(
                      (s) => s.audience === ref.audience && s.code === ref.code,
                    );
                    return (
                      <li
                        key={JSON.stringify(ref)}
                        className="break-all text-xs text-muted-foreground"
                      >
                        {scope && scope.name !== ref.code && (
                          <>
                            {scope.name}
                            {" · "}
                          </>
                        )}
                        <span className="font-mono">{ref.code}</span>
                        {" · "}
                        {ref.audience}
                      </li>
                    );
                  })}
                </ul>
                {missingPermission && (
                  <p role="status" className="text-xs text-destructive">
                    La función tiene permisos deshabilitados o sin URL de API.
                    Revisa el catálogo de scopes antes de crear el cliente.
                  </p>
                )}
              </div>
            )}
            <Field
              id={`client-selection-${index}`}
              label="Cliente de Identity"
              help="Reutiliza el cliente del backend. Al guardar se asignan los permisos seleccionados."
            >
              <Choice
                id={`client-selection-${index}`}
                value={binding.clientId}
                disabled={locked || !options.length || !fn}
                options={options}
                describedBy={`client-selection-${index}-help`}
                placeholder={
                  options.length
                    ? "Selecciona un cliente"
                    : "Sin clientes disponibles"
                }
                onChange={(selectedId) => {
                  const selected = directory.find(
                    (c) => c.clientId === selectedId,
                  );
                  if (selected)
                    change(index, {
                      clientId: selected.clientId,
                      oauthIssuer: selected.oauthIssuer,
                    });
                }}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={locked || !fn || missingPermission}
              onClick={() => {
                setCreatingFor(index);
                setClientId(`${systemCode || "system"}-backend`.slice(0, 120));
                setError("");
              }}
            >
              Crear cliente en Identity
            </Button>
            {creatingFor === index && (
              <div className="space-y-4 rounded-lg border border-primary/20 p-4">
                <Field
                  id={`new-client-${index}`}
                  label="Identificador del cliente"
                  help="Se creará ahora en Identity con los permisos de la función. La asociación se guarda con Guardar sistema."
                >
                  <Input
                    id={`new-client-${index}`}
                    className="h-10"
                    minLength={2}
                    maxLength={120}
                    pattern="[a-z0-9][a-z0-9._-]+"
                    value={clientId}
                    disabled={disabled}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="min-h-10 max-w-full whitespace-normal"
                    loading={pending}
                    disabled={disabled || !clientId.trim() || missingPermission}
                    onClick={() => void create(index)}
                  >
                    Crear con los permisos seleccionados
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-10"
                    disabled={disabled}
                    onClick={() => setCreatingFor(null)}
                  >
                    Cancelar creación
                  </Button>
                </div>
              </div>
            )}
            <div className="flex min-h-10 items-center justify-between gap-3">
              <label
                htmlFor={`client-enabled-${index}`}
                className="text-sm font-medium"
              >
                Cliente habilitado
              </label>
              <Switch
                id={`client-enabled-${index}`}
                checked={binding.enabled}
                disabled={locked}
                onCheckedChange={(enabled) => change(index, { enabled })}
              />
            </div>
          </fieldset>
        );
      })}
    </Card>
  );
}
