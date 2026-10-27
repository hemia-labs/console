"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/ui/input";
import { consoleApi } from "@/lib/console-api";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";

type InvitationRole = { code: string; name: string; scope: string; status: string };
const statuses: Record<string, string> = { pending: "Pendiente", accepted: "Aceptada", expired: "Vencida", revoked: "Revocada" };

type Invitation = { id: string; emailNormalized: string; status: string; expiresAt: string; delivery?: "sent" | "failed" };

export function OrganizationInvitationsSection({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<InvitationRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const base = `/access/organizations/${organizationId}/invitations`;

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setMessage(""); setItems([]); setRoles([]); setSelectedRoles([]);
    Promise.all([consoleApi.get<Invitation[]>(base), consoleApi.get<InvitationRole[]>(`/access/organizations/${organizationId}/roles`)]).then(([data, catalog]) => {
      if (!active) return;
      const available = catalog.filter(role => role.scope === "organization" && role.status === "active");
      setItems(data); setRoles(available);
      setSelectedRoles(available.some(role => role.code === "organization_member") ? ["organization_member"] : []);
    })
      .catch(e => { if (active) setError(apiErrorMessage(e)) })
      .finally(() => { if (active) setLoading(false) });
    return () => { active = false };
  }, [base, organizationId]);

  async function refresh() {
    setLoading(true);
    try {
      const [data, catalog] = await Promise.all([consoleApi.get<Invitation[]>(base), consoleApi.get<InvitationRole[]>(`/access/organizations/${organizationId}/roles`)]);
      const available = catalog.filter(role => role.scope === "organization" && role.status === "active");
      setItems(data); setRoles(available); setError("");
      setSelectedRoles(previous => previous.length ? previous.filter(code => available.some(role => role.code === code)) : available.some(role => role.code === "organization_member") ? ["organization_member"] : []);
    } finally { setLoading(false) }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try {
      const result = await consoleApi.post<Invitation>(base, { email: email.trim(), role_codes: selectedRoles });
      setEmail("");
      setMessage(result.delivery === "sent" ? "Invitación enviada por correo." : "Invitación creada, pero el correo no pudo enviarse. Revisa SES y usa Reenviar.");
      await refresh();
    } catch (e) { setError(apiErrorMessage(e)) }
    finally { setPending(false) }
  }
  async function action(id: string, action: "resend" | "revoke") {
    if (action === "revoke" && !window.confirm("¿Revocar esta invitación? El enlace dejará de funcionar.")) return;
    setPending(true); setError(""); setMessage("");
    try {
      const result = await consoleApi.post<Invitation>(`/access/invitations/${id}/${action}`);
      setMessage(action === "revoke" ? "Invitación revocada." : result.delivery === "sent" ? "Invitación reenviada. El enlace anterior dejó de funcionar." : "El reenvío falló. Revisa SES e intenta de nuevo.");
      await refresh();
    } catch (e) { setError(apiErrorMessage(e)) }
    finally { setPending(false) }
  }

  return <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm" aria-labelledby="invitations-title">
    <h2 id="invitations-title" className="text-base font-semibold">Invitaciones</h2>
    <p className="text-sm text-muted-foreground">Invita a una persona por correo para que cree su cuenta o inicie sesión y se una a esta organización.</p>
    <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm">Correo<Input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" maxLength={320} required /></label>
      <fieldset className="flex-1 space-y-2 text-sm" disabled={pending || loading}>
        <legend className="mb-2">Roles organizacionales</legend>
        {roles.map(role => <label key={role.code} className="flex items-center gap-2"><input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={e => setSelectedRoles(previous => e.target.checked ? [...previous, role.code] : previous.filter(code => code !== role.code))} />{role.name}</label>)}
        {!loading && !roles.length ? <p>No hay roles organizacionales activos para invitar.</p> : null}
      </fieldset>
      <Button type="submit" disabled={pending || loading || !selectedRoles.length}>{pending ? "Procesando…" : "Invitar"}</Button>
    </form>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    {loading ? <p role="status">Cargando invitaciones…</p> : items.length ? <ul className="divide-y divide-border">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="break-all font-medium">{item.emailNormalized}</p><p className="text-xs text-muted-foreground">{statuses[item.status] ?? item.status} · Vence: {new Date(item.expiresAt).toLocaleString("es-MX")}</p></div>
      {item.status === "pending" ? <div className="flex gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => void action(item.id, "resend")}>Reenviar</Button><Button type="button" variant="outline" disabled={pending} onClick={() => void action(item.id, "revoke")}>Revocar</Button></div> : null}
    </li>)}</ul> : <p className="text-sm text-muted-foreground">No hay invitaciones para esta organización.</p>}
    {error ? <Button type="button" variant="outline" disabled={pending} onClick={() => void refresh().catch(e => setError(apiErrorMessage(e)))}>Actualizar lista</Button> : null}
  </section>;
}
