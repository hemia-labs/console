"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { useConsoleSession } from "@/features/auth/console-session-provider";
import { consoleApi, ConsoleApiError } from "@/lib/console-api";
import { listOrganizations } from "./organizations/api";
import type { AccessOrganization } from "./organizations/types";
import {
  RoleAssignmentSelect,
  type AssignmentOption,
} from "./role-assignment-select";
import {
  assignmentError,
  SystemRoleAssignmentForm,
} from "./system-role-assignment-form";
import {
  assignmentPath,
  scopeName,
  type Assignment,
} from "./system-role-assignment-model";
import {
  latestCatalogs,
  readCatalogs,
  type SystemRoleCatalog,
} from "./system-role-catalogs/catalogs";

type Membership = {
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
type Member = AssignmentOption & { canGrant: boolean };
const dateFormat = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function loadWorkspace(signal: AbortSignal) {
  const [organizations, catalogResponse] = await Promise.all([
    listOrganizations({ status: "active" }, { signal, cache: "no-store" }),
    consoleApi.get<unknown>("/access/system-role-catalogs", {
      signal,
      cache: "no-store",
    }),
  ]);
  const catalogs = readCatalogs(catalogResponse);
  return { organizations, catalogs };
}

export function SystemRoleAssignments() {
  const [organizationId, setOrganizationId] = useState("");
  return (
    <ConsoleDataLoader
      load={loadWorkspace}
      title="No se pudo cargar la administración de roles"
    >
      {({ organizations, catalogs }) => {
        const internal = organizations.filter(
          (item) => item.type === "internal",
        );
        const organization = internal.find(
          (item) => item.id === organizationId,
        );
        return (
          <div className="max-w-4xl space-y-5">
            <Card className="p-5">
              {internal.length ? (
                <RoleAssignmentSelect
                  label="Organización de la membresía"
                  value={organizationId}
                  options={internal}
                  onChange={setOrganizationId}
                />
              ) : (
                <p role="status" className="text-sm text-muted-foreground">
                  No hay organizaciones internas activas.
                </p>
              )}
            </Card>
            {organization && (
              <OrganizationMembers
                key={organization.id}
                organization={organization}
                organizations={organizations}
                catalogs={catalogs}
              />
            )}
          </div>
        );
      }}
    </ConsoleDataLoader>
  );
}

function OrganizationMembers({
  organization,
  organizations,
  catalogs,
}: {
  organization: AccessOrganization;
  organizations: AccessOrganization[];
  catalogs: SystemRoleCatalog[];
}) {
  const { user } = useConsoleSession();
  const [memberId, setMemberId] = useState("");
  const loadMembers = useCallback(
    async (signal: AbortSignal): Promise<Member[]> => {
      const memberships = await consoleApi.get<Membership[]>(
        `/access/organizations/${organization.id}/memberships`,
        { signal, cache: "no-store" },
      );
      return memberships.flatMap((membership) => {
        const identity = membership.identityReference;
        if (!identity || identity.identityType === "service_account") return [];
        const self =
          identity.issuer === user.iss && identity.subjectId === user.sub;
        const eligible =
          membership.status === "active" &&
          identity.status === "active" &&
          (!membership.expiresAt ||
            Date.parse(membership.expiresAt) > Date.now());
        const name =
          [identity.displayNameSnapshot, identity.emailSnapshot]
            .filter(Boolean)
            .join(" · ") || identity.subjectId;
        return [
          {
            id: membership.id,
            name: self
              ? `${name} (tu cuenta)`
              : eligible
                ? name
                : `${name} (inactiva)`,
            canGrant: eligible && !self,
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
      {(members) => {
        const member = members.find((item) => item.id === memberId);
        return (
          <>
            <Card className="p-5">
              {members.length ? (
                <RoleAssignmentSelect
                  label="Miembro"
                  value={memberId}
                  options={members}
                  onChange={setMemberId}
                />
              ) : (
                <p role="status" className="text-sm text-muted-foreground">
                  No hay miembros disponibles.
                </p>
              )}
            </Card>
            {member && (
              <MemberAssignments
                key={member.id}
                member={member}
                catalogs={catalogs}
                organizations={organizations}
              />
            )}
          </>
        );
      }}
    </ConsoleDataLoader>
  );
}

function MemberAssignments({
  member,
  catalogs,
  organizations,
}: {
  member: Member;
  catalogs: SystemRoleCatalog[];
  organizations: AccessOrganization[];
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      try {
        return await consoleApi.get<Assignment[]>(assignmentPath, {
          query: { membershipId: member.id },
          signal,
          cache: "no-store",
        });
      } catch (cause) {
        if (cause instanceof ConsoleApiError && cause.status === 403)
          throw new Error(
            "Se requiere el rol de administrador de plataforma para administrar estas asignaciones.",
          );
        throw cause;
      }
    },
    [member.id],
  );

  return (
    <ConsoleDataLoader
      load={load}
      title="No se pudieron consultar las asignaciones"
    >
      {(assignments, refresh) => (
        <AssignmentWorkspace
          assignments={assignments}
          catalogs={catalogs}
          member={member}
          organizations={organizations}
          refresh={refresh}
        />
      )}
    </ConsoleDataLoader>
  );
}

function AssignmentWorkspace({
  assignments,
  catalogs,
  member,
  organizations,
  refresh,
}: {
  assignments: Assignment[];
  catalogs: SystemRoleCatalog[];
  member: Member;
  organizations: AccessOrganization[];
  refresh: () => void;
}) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState("");
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const inFlight = useRef(false);
  const activeAssignments = assignments.filter(
    (assignment) => !revokedIds.includes(assignment.id),
  );
  const published = latestCatalogs(
    catalogs.filter(
      (catalog) =>
        catalog.publicationStatus === "published" &&
        catalog.roles.some((role) => role.id && role.permissions?.length),
    ),
  );

  async function revoke(assignment: Assignment) {
    if (
      inFlight.current ||
      !window.confirm(
        `¿Revocar «${assignment.roleName}» para ${member.name}? La persona perderá el acceso concedido por esta asignación.`,
      )
    )
      return;
    inFlight.current = true;
    setRevoking(assignment.id);
    setError("");
    setNotice("");
    try {
      await consoleApi.post(`${assignmentPath}/${assignment.id}/revoke`, {
        expectedVersion: assignment.version,
      });
      setRevokedIds((ids) => [...ids, assignment.id]);
      setNotice(`Se revocó «${assignment.roleName}».`);
      refresh();
    } catch (cause) {
      setError(assignmentError(cause));
      if (cause instanceof ConsoleApiError && cause.status === 409) refresh();
    } finally {
      inFlight.current = false;
      setRevoking("");
    }
  }

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Asignaciones de la membresía</h2>
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={!!revoking}
          >
            Actualizar
          </Button>
        </div>
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {activeAssignments.length ? (
          <ul className="divide-y rounded-md border">
            {activeAssignments.map((assignment) => {
              const catalog = catalogs.find(
                (item) =>
                  item.productCode === assignment.productCode &&
                  item.version === assignment.catalogVersion,
              );
              const role = catalog?.roles.find(
                (item) => item.code === assignment.roleCode,
              );
              return (
                <li
                  key={assignment.id}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0 space-y-2 text-sm">
                    <p className="font-medium">
                      {assignment.roleName} ·{" "}
                      {catalog?.name ?? assignment.productCode}
                    </p>
                    <p className="text-muted-foreground">
                      {scopeName({
                        resource: assignment.scopeType,
                        consumer: assignment.consumerScopeType,
                      })}
                    </p>
                    {assignment.targets.length > 0 && (
                      <ul className="break-all text-xs text-muted-foreground">
                        {assignment.targets.map((target) => (
                          <li key={`${target.type}:${target.id}`}>
                            {target.name ?? target.id}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {assignment.status === "scheduled" && "Programada · "}
                      {assignment.status === "inactive_delegation" &&
                        "Delegación sin vigencia · "}
                      Desde {dateFormat.format(new Date(assignment.validFrom))}{" "}
                      ·{" "}
                      {assignment.expiresAt
                        ? `Vence el ${dateFormat.format(new Date(assignment.expiresAt))}`
                        : "Sin vencimiento"}
                    </p>
                    {role?.permissions?.length ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-medium">
                          Ver permisos
                        </summary>
                        <ul className="mt-1 space-y-1 break-all font-mono text-xs text-muted-foreground">
                          {role.permissions.map((permission) => (
                            <li key={permission}>{permission}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!!revoking}
                    loading={revoking === assignment.id}
                    aria-label={`Revocar ${assignment.roleName} de ${catalog?.name ?? assignment.productCode}`}
                    onClick={() => void revoke(assignment)}
                  >
                    Revocar
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            La membresía no tiene asignaciones registradas y sin vencer.
          </p>
        )}
      </Card>
      <Card className="p-5">
        {member.canGrant && published.length ? (
          <SystemRoleAssignmentForm
            catalogs={published}
            member={member}
            organizations={organizations}
            onAssigned={(message) => {
              setNotice(message);
              setError("");
              refresh();
            }}
          />
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            {member.canGrant
              ? "No hay catálogos publicados disponibles para asignar."
              : "Para asignar un rol, selecciona a otro miembro con una membresía activa."}
          </p>
        )}
      </Card>
    </>
  );
}
