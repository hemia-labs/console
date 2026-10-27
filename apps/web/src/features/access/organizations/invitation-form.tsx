"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Send, ShieldCheck, CheckCircle2, CircleAlert } from "lucide-react";
import { Button } from "@/components/zuno/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/zuno/card";
import { Input } from "@/components/ui/input";
import { consoleApi } from "@/lib/console-api";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import type { Invitation } from "./invitation-types";
type InvitationRole = { code: string; name: string; description?: string | null; scope: string; status: string };

const roleLabels: Record<string, string> = {
  organization_owner: "Propietario de la organización",
  organization_admin: "Administrador de la organización",
  organization_member: "Miembro de la organización",
  engineering: "Ingeniería",
  finance: "Finanzas",
  legal: "Legal",
  support: "Soporte",
};

export function InvitationForm({ organizationId, locale, onPendingChange }: { organizationId: string; locale: string; onPendingChange: (pending: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<InvitationRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Invitation | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    consoleApi.get<InvitationRole[]>(`/access/organizations/${organizationId}/roles`).then(catalog => {
      if (!active) return;
      const available = catalog.filter(role => role.scope === "organization" && role.status === "active");
      setRoles(available); setSelectedRoles(available.some(role => role.code === "organization_member") ? ["organization_member"] : []);
    }).catch(e => { if (active) setError(apiErrorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organizationId, revision]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || loading || !selectedRoles.length) return;
    setPending(true); onPendingChange(true); setError("");
    try { setResult(await consoleApi.post<Invitation>(`/access/organizations/${organizationId}/invitations`, { email: email.trim(), role_codes: selectedRoles })); }
    catch (e) { setError(apiErrorMessage(e)); }
    finally { setPending(false); onPendingChange(false); }
  }
  if (result) return <Card><CardHeader><span className="text-primary">{result.delivery === "sent" ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}</span><CardTitle>Invitación creada</CardTitle><CardDescription role="status">{result.delivery === "sent" ? `Enviamos la invitación a ${result.emailNormalized}.` : "La invitación se creó, pero el correo no pudo enviarse. Puedes reenviarlo desde el listado."}</CardDescription></CardHeader><CardContent><Button render={<Link href={`/${locale}/access/invitations`} />}>Ver invitaciones</Button></CardContent></Card>;
  return <div className="space-y-4">
    {error ? <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"><p>{error}</p><Button variant="outline" disabled={pending || loading} onClick={() => { setLoading(true); setError(""); setRevision(value => value + 1); }}>Reintentar</Button></div> : null}
    {loading ? <p role="status" className="text-sm text-muted-foreground">Cargando roles…</p> : null}
      <Card>
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Send className="size-5" aria-hidden="true" /></span>
          <CardTitle>Nueva invitación</CardTitle>
          <CardDescription>Envía un enlace para unirse a esta organización con una cuenta de Hemia.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="invitation-email" className="text-sm font-medium">Correo electrónico</label>
              <Input id="invitation-email" className="h-10" placeholder="nombre@empresa.com" value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" maxLength={320} required disabled={pending || loading} aria-describedby="invitation-email-help" />
              <p id="invitation-email-help" className="text-xs leading-5 text-muted-foreground">Podrá crear una cuenta o iniciar sesión para aceptar.</p>
            </div>
            <fieldset className="space-y-2" disabled={pending || loading}>
              <legend className="mb-2 text-sm font-medium">Roles organizacionales</legend>
              {roles.map(role => <label key={role.code} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm transition-colors has-checked:border-primary/40 has-checked:bg-primary/5 hover:bg-muted/50 has-disabled:cursor-not-allowed has-disabled:opacity-60">
                <input className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" type="checkbox" checked={selectedRoles.includes(role.code)} onChange={e => setSelectedRoles(previous => e.target.checked ? [...previous, role.code] : previous.filter(code => code !== role.code))} />
                <span className="min-w-0 flex-1 break-words">{role.name === role.code ? roleLabels[role.code] ?? role.name : role.name}</span><ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </label>)}
              {!loading && !roles.length ? <p className="text-sm text-muted-foreground">No hay roles organizacionales activos para invitar.</p> : null}
            </fieldset>
            <Button type="submit" className="min-h-10 w-full" loading={pending} disabled={loading || !selectedRoles.length}><Send className="size-4" aria-hidden="true" />{pending ? "Procesando…" : "Enviar invitación"}</Button>
          <Button variant="outline" className="min-h-10 w-full" disabled={pending} render={<Link href={`/${locale}/access/invitations`} />}>Cancelar</Button>
          </form>
        </CardContent>
      </Card>
  </div>;
}
