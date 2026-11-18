"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { useConsoleSession } from "@/features/auth/console-session-provider";
import { consoleApi, ConsoleApiError } from "@/lib/console-api";
import { listOrganizations } from "./organizations/api";
import type { AccessOrganization } from "./organizations/types";
import { latestCatalogs, readCatalogs } from "./system-role-catalogs/catalogs";

const scopeNames = {
  catalog_global: "Catálogo global",
  all_customers: "Todos los clientes",
  organizations: "Solo la organización seleccionada",
};

type Scope = keyof typeof scopeNames;
type Role = { id: string; name: string; scopes: Scope[] };
type Member = {
  id: string;
  status: string;
  expiresAt: string | null;
  identityReference: {
    issuer: string;
    subjectId: string;
    identityType: string;
    status: string;
    displayNameSnapshot: string | null;
    emailSnapshot: string | null;
  };
};
type Option = { id: string; name: string };

function AssignmentSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        className="min-h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value="" disabled>
          Selecciona una opción
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

async function loadAssignmentOptions(signal: AbortSignal) {
  const [organizations, catalogs] = await Promise.all([
    listOrganizations({ status: "active", type: "internal" }, { signal }),
    consoleApi.get<unknown>("/access/system-role-catalogs", {
      signal,
      cache: "no-store",
    }),
  ]);
  const catalog = latestCatalogs(readCatalogs(catalogs)).find(
    (item) =>
      item.productCode === "billing" && item.publicationStatus === "published",
  );
  const roles: Role[] = (catalog?.roles ?? []).flatMap((role) => {
    const scopes = role.allowedScopes
      .filter(
        (scope) =>
          scope.consumer === "not_applicable" &&
          Object.hasOwn(scopeNames, scope.resource),
      )
      .map((scope) => scope.resource as Scope);
    return role.id && scopes.length
      ? [{ id: role.id, name: role.name, scopes }]
      : [];
  });
  return { organizations, roles };
}

export function BillingRoleAssignments() {
  const [organizationId, setOrganizationId] = useState("");
  return (
    <ConsoleDataLoader
      load={loadAssignmentOptions}
      title="No se pudo cargar la asignación de roles"
    >
      {({ organizations, roles }) => {
        const organization = organizations.find(
          (item) => item.id === organizationId,
        );
        if (!roles.length || !organizations.length)
          return (
            <p role="status" className="text-sm text-muted-foreground">
              {!roles.length
                ? "No hay roles publicados de Billing disponibles para asignar."
                : "No hay organizaciones internas activas."}
            </p>
          );
        return (
          <Card className="max-w-3xl space-y-5 p-5 sm:p-6">
            <p className="text-sm text-muted-foreground">
              La asignación requiere un administrador de plataforma y queda
              registrada en Access.
            </p>
            <AssignmentSelect
              label="Organización"
              value={organizationId}
              options={organizations}
              onChange={setOrganizationId}
            />
            {organization && (
              <OrganizationAssignment
                key={organization.id}
                organization={organization}
                roles={roles}
              />
            )}
          </Card>
        );
      }}
    </ConsoleDataLoader>
  );
}

function OrganizationAssignment({
  organization,
  roles,
}: {
  organization: AccessOrganization;
  roles: Role[];
}) {
  const { user } = useConsoleSession();
  const loadMembers = useCallback(
    async (signal: AbortSignal) => {
      const members = await consoleApi.get<Member[]>(
        `/access/organizations/${organization.id}/memberships`,
        { signal, cache: "no-store" },
      );
      return members.flatMap((member) => {
        const identity = member.identityReference;
        if (
          member.status !== "active" ||
          (member.expiresAt && Date.parse(member.expiresAt) <= Date.now()) ||
          identity?.status !== "active" ||
          identity.identityType === "service_account" ||
          (identity.subjectId === user.sub && identity.issuer === user.iss)
        )
          return [];
        return [
          {
            id: member.id,
            name:
              [identity.displayNameSnapshot, identity.emailSnapshot]
                .filter(Boolean)
                .join(" · ") || identity.subjectId,
          },
        ];
      });
    },
    [organization.id, user.iss, user.sub],
  );

  return (
    <ConsoleDataLoader
      load={loadMembers}
      title="No se pudo cargar a los miembros"
    >
      {(members) =>
        members.length ? (
          <AssignmentForm
            organization={organization}
            roles={roles}
            members={members}
          />
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            No hay otros miembros activos disponibles.
          </p>
        )
      }
    </ConsoleDataLoader>
  );
}

function AssignmentForm({
  organization,
  roles,
  members,
}: {
  organization: AccessOrganization;
  roles: Role[];
  members: Option[];
}) {
  const [memberId, setMemberId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState<{ message: string; error?: boolean }>();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const retry = useRef<{ idempotencyKey: string; validFrom: string } | null>(
    null,
  );
  const member = members.find((item) => item.id === memberId);
  const role = roles.find((item) => item.id === roleId);
  const scopes = role?.scopes.map((id) => ({ id, name: scopeNames[id] })) ?? [];
  const selectedScope = scopes.find((item) => item.id === scope);

  function clearResult() {
    retry.current = null;
    setStatus(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !member || !role || !selectedScope) return;
    const scopeLabel =
      scope === "organizations" ? organization.name : selectedScope.name;
    if (
      !window.confirm(
        `¿Asignar «${role.name}» a ${member.name} con alcance «${scopeLabel}»?`,
      )
    )
      return;

    inFlight.current = true;
    setBusy(true);
    setStatus(undefined);
    try {
      retry.current ??= {
        idempotencyKey: crypto.randomUUID(),
        validFrom: new Date().toISOString(),
      };
      await consoleApi.post("/access/billing-role-assignments", {
        membershipId: member.id,
        roleId: role.id,
        organizationId: organization.id,
        scopeType: scope,
        ...retry.current,
      });
      setMemberId("");
      setRoleId("");
      setScope("");
      retry.current = null;
      setStatus({ message: `Se asignó «${role.name}» a ${member.name}.` });
    } catch (cause) {
      const status = cause instanceof ConsoleApiError ? cause.status : null;
      setStatus({
        error: true,
        message:
          status === 403
            ? "La asignación requiere un administrador de plataforma y un destinatario autorizado."
            : status === 400 || status === 404
              ? "Verifica que el miembro, el rol y el alcance sigan disponibles."
              : status === 429
                ? "Espera un momento antes de volver a intentar."
                : "No se pudo confirmar la asignación. Puedes reintentar con los mismos datos.",
      });
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
      <fieldset disabled={busy} className="grid gap-4">
        <AssignmentSelect
          label="Miembro"
          value={memberId}
          options={members}
          onChange={(value) => {
            setMemberId(value);
            clearResult();
          }}
        />
        <AssignmentSelect
          label="Rol de Billing"
          value={roleId}
          options={roles}
          onChange={(value) => {
            setRoleId(value);
            setScope("");
            clearResult();
          }}
        />
        {role && (
          <AssignmentSelect
            label="Alcance"
            value={scope}
            options={scopes}
            onChange={(value) => {
              setScope(value);
              clearResult();
            }}
          />
        )}
      </fieldset>
      {status && (
        <p
          role={status.error ? "alert" : "status"}
          className={status.error ? "text-sm text-destructive" : "text-sm"}
        >
          {status.message}
        </p>
      )}
      <Button
        type="submit"
        loading={busy}
        disabled={busy || !member || !role || !selectedScope}
      >
        {busy ? "Asignando…" : "Asignar rol"}
      </Button>
    </form>
  );
}
