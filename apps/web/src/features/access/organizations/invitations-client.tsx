"use client";
import { useEffect, useState } from "react";
import { listOrganizations } from "./api";
import type { AccessOrganization } from "./types";
import { OrganizationInvitationsSection } from "./organization-invitations-section";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";

export function InvitationsClient() {
  const [organizations, setOrganizations] = useState<AccessOrganization[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    listOrganizations({ status: "active" }).then(items => { if (active) setOrganizations(items) })
      .catch(e => { if (active) setError(apiErrorMessage(e)) })
      .finally(() => { if (active) setLoading(false) });
    return () => { active = false };
  }, []);
  return <div className="space-y-5">
    {loading ? <p role="status">Cargando organizaciones…</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    <label className="block text-sm">Organización<select className="mt-2 block w-full rounded-md border bg-background p-2" value={selected} onChange={e => setSelected(e.target.value)} disabled={loading}>
      <option value="">Selecciona una organización</option>
      {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
    </select></label>
    {!loading && !error && !organizations.length ? <p>No hay organizaciones activas.</p> : null}
    {selected ? <OrganizationInvitationsSection key={selected} organizationId={selected} /> : null}
  </div>;
}
