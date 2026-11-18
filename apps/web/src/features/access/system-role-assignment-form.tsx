"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { consoleApi, ConsoleApiError } from "@/lib/console-api";
import {
  RoleAssignmentSelect,
  type AssignmentOption,
} from "./role-assignment-select";
import {
  assignmentPath,
  buildAssignmentPayload,
  parseTargetIds,
  scopeName,
} from "./system-role-assignment-model";
import type { SystemRoleCatalog } from "./system-role-catalogs/catalogs";

type TargetSelection = { selected: string[]; additional: string };
const emptyTargets = { selected: [], additional: "" };

function TargetPicker({
  label,
  options,
  selection,
  onChange,
}: {
  label: string;
  options: AssignmentOption[];
  selection: TargetSelection;
  onChange: (value: TargetSelection) => void;
}) {
  return (
    <fieldset className="space-y-2 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      {options.length > 0 && (
        <div className="max-h-40 space-y-2 overflow-y-auto">
          {options.map((option) => (
            <label key={option.id} className="flex items-start gap-2 text-sm">
              <input
                className="mt-0.5"
                type="checkbox"
                checked={selection.selected.includes(option.id)}
                onChange={(event) =>
                  onChange({
                    ...selection,
                    selected: event.target.checked
                      ? [...selection.selected, option.id]
                      : selection.selected.filter((id) => id !== option.id),
                  })
                }
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-sm">Añadir por ID</summary>
        <label className="mt-2 grid gap-1 text-sm">
          IDs de {label.toLowerCase()}
          <textarea
            className="min-h-16 rounded-md border bg-card p-2 font-mono text-xs"
            value={selection.additional}
            onChange={(event) =>
              onChange({ ...selection, additional: event.target.value })
            }
            placeholder="UUID separados por comas o saltos de línea"
          />
        </label>
      </details>
    </fieldset>
  );
}

function LegalTargets({
  kind,
  selection,
  onChange,
}: {
  kind: "issuers" | "applications";
  selection: TargetSelection;
  onChange: (value: TargetSelection) => void;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const data = await consoleApi.get<{
        applications: {
          id: string;
          name: string;
          issuerId: string;
          issuerName: string;
        }[];
      }>("/legal/system-catalog/connections/options/legal", {
        signal,
        cache: "no-store",
      });
      return kind === "applications"
        ? data.applications.map((app) => ({
            id: app.id,
            name: `${app.name} · ${app.issuerName}`,
          }))
        : [
            ...new Map(
              data.applications.map((app) => [
                app.issuerId,
                { id: app.issuerId, name: app.issuerName },
              ]),
            ).values(),
          ];
    },
    [kind],
  );
  const label = kind === "issuers" ? "Emisores" : "Aplicaciones";
  return (
    <ConsoleDataLoader
      load={load}
      title="No se pudieron cargar los recursos de Legal"
    >
      {(options) => (
        <TargetPicker
          label={label}
          options={options}
          selection={selection}
          onChange={onChange}
        />
      )}
    </ConsoleDataLoader>
  );
}

export function assignmentError(error: unknown) {
  if (error instanceof ConsoleApiError) {
    if (error.status === 403)
      return "Se requiere un administrador de plataforma con autorización para esta operación.";
    if (error.status === 409)
      return "Access detectó una asignación equivalente o un cambio concurrente. Revisa la lista antes de continuar.";
    if (error.status === 400 || error.status === 404)
      return "Verifica que el miembro, el rol, el alcance y las fechas sigan disponibles.";
    if (error.status === 429)
      return "Espera un momento antes de volver a intentar.";
  }
  return "No se pudo confirmar la operación. Puedes volver a intentar con los mismos datos.";
}

export function SystemRoleAssignmentForm({
  catalogs,
  member,
  organizations,
  onAssigned,
}: {
  catalogs: SystemRoleCatalog[];
  member: AssignmentOption;
  organizations: AssignmentOption[];
  onAssigned: (message: string) => void;
}) {
  const [productCode, setProductCode] = useState("");
  const [roleId, setRoleId] = useState("");
  const [scopeKey, setScopeKey] = useState("");
  const [organizationTargets, setOrganizationTargets] =
    useState<TargetSelection>(emptyTargets);
  const [resourceTargets, setResourceTargets] =
    useState<TargetSelection>(emptyTargets);
  const [starts, setStarts] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const retry = useRef<{
    signature: string;
    idempotencyKey: string;
    validFrom: string;
  } | null>(null);

  const catalog = catalogs.find((item) => item.productCode === productCode);
  const roles = (catalog?.roles ?? []).flatMap((role) =>
    role.id ? [{ ...role, id: role.id }] : [],
  );
  const role = roles.find((item) => item.id === roleId);
  const scopes = (role?.allowedScopes ?? []).map((scope) => ({
    ...scope,
    id: `${scope.resource}:${scope.consumer}`,
    name: scopeName(scope),
  }));
  const scope = scopes.find((item) => item.id === scopeKey);
  const needsOrganizations =
    scope?.resource === "organizations" || scope?.consumer === "organizations";
  const resourceKind =
    scope?.resource === "issuers" || scope?.resource === "applications"
      ? scope.resource
      : null;

  function resetTargets() {
    setOrganizationTargets(emptyTargets);
    setResourceTargets(emptyTargets);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !role || !scope || !catalog) return;
    let organizationIds: string[];
    let resourceIds: string[];
    let expiresAt: string | null;
    let startDate: Date;
    try {
      organizationIds = parseTargetIds(
        organizationTargets.selected,
        organizationTargets.additional,
      );
      resourceIds = parseTargetIds(
        resourceTargets.selected,
        resourceTargets.additional,
      );
      if (
        (needsOrganizations && !organizationIds.length) ||
        (resourceKind && !resourceIds.length)
      )
        throw new Error(
          "Selecciona al menos un destino para cada parte del alcance.",
        );
      startDate = starts ? new Date(starts) : new Date();
      expiresAt = expires ? new Date(expires).toISOString() : null;
      if (expiresAt && new Date(expiresAt) <= startDate)
        throw new Error("El vencimiento debe ser posterior al inicio.");
    } catch (cause) {
      setError(
        cause instanceof RangeError
          ? "Revisa las fechas de vigencia."
          : (cause as Error).message,
      );
      return;
    }
    if (
      !window.confirm(
        `¿Asignar «${role.name}» de ${catalog.name} a ${member.name} con alcance «${scope.name}»?`,
      )
    )
      return;

    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const signature = JSON.stringify([
        role.id,
        scope.id,
        organizationIds,
        resourceIds,
        starts,
        expires,
      ]);
      if (retry.current?.signature !== signature) {
        retry.current = {
          signature,
          idempotencyKey: crypto.randomUUID(),
          validFrom: startDate.toISOString(),
        };
      }
      await consoleApi.post(
        assignmentPath,
        buildAssignmentPayload(
          {
            membershipId: member.id,
            roleId: role.id,
            scope,
            organizationIds,
            resourceIds,
          },
          {
            idempotencyKey: retry.current.idempotencyKey,
            validFrom: retry.current.validFrom,
            expiresAt,
          },
        ),
      );
      retry.current = null;
      setRoleId("");
      setScopeKey("");
      setStarts("");
      setExpires("");
      resetTargets();
      onAssigned(`Se asignó «${role.name}» a ${member.name}.`);
    } catch (cause) {
      setError(assignmentError(cause));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      aria-busy={busy}
      className="space-y-4"
    >
      <h2 className="font-semibold">Asignar un rol</h2>
      <fieldset disabled={busy} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <RoleAssignmentSelect
            label="Sistema"
            value={productCode}
            options={catalogs.map((item) => ({
              id: item.productCode,
              name: item.name,
            }))}
            onChange={(value) => {
              setProductCode(value);
              setRoleId("");
              setScopeKey("");
              resetTargets();
            }}
          />
          {catalog && (
            <RoleAssignmentSelect
              label="Rol"
              value={roleId}
              options={roles}
              onChange={(value) => {
                setRoleId(value);
                setScopeKey("");
                resetTargets();
              }}
            />
          )}
        </div>
        {role && (
          <>
            <details open className="rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Permisos incluidos
              </summary>
              <ul className="mt-2 grid gap-1 break-all font-mono text-xs text-muted-foreground sm:grid-cols-2">
                {role.permissions?.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            </details>
            <RoleAssignmentSelect
              label="Alcance"
              value={scopeKey}
              options={scopes}
              onChange={(value) => {
                setScopeKey(value);
                resetTargets();
              }}
            />
          </>
        )}
        {resourceKind && (
          <LegalTargets
            kind={resourceKind}
            selection={resourceTargets}
            onChange={setResourceTargets}
          />
        )}
        {needsOrganizations && (
          <TargetPicker
            label="Organizaciones"
            options={organizations}
            selection={organizationTargets}
            onChange={setOrganizationTargets}
          />
        )}
        {scope && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Inicio (ahora si queda vacío)
              <Input
                type="datetime-local"
                value={starts}
                onChange={(event) => setStarts(event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Vencimiento (opcional)
              <Input
                type="datetime-local"
                value={expires}
                onChange={(event) => setExpires(event.target.value)}
              />
            </label>
          </div>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" loading={busy} disabled={busy || !role || !scope}>
        {busy ? "Asignando…" : "Asignar rol"}
      </Button>
    </form>
  );
}
