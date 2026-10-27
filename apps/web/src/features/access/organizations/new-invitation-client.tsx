"use client";
import { useEffect, useState } from "react";
import { Building2, MailPlus } from "lucide-react";
import { Button } from "@/components/zuno/button";
import { Card, CardContent } from "@/components/zuno/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/zuno/select";
import { listOrganizations } from "./api";
import type { AccessOrganization } from "./types";
import { InvitationForm } from "./invitation-form";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";

export function NewInvitationClient({ locale, initialOrganizationId = "" }: { locale: string; initialOrganizationId?: string }) {
  const [organizations, setOrganizations] = useState<AccessOrganization[]>([]);
  const [selected, setSelected] = useState(initialOrganizationId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    listOrganizations({ status: "active" }).then(items => { if (active) { setOrganizations(items); setSelected(previous => items.some(org => org.id === previous) ? previous : ""); } })
      .catch(e => { if (active) setError(apiErrorMessage(e)) })
      .finally(() => { if (active) setLoading(false) });
    return () => { active = false };
  }, [revision]);
  return <div className="mx-auto max-w-3xl space-y-5">
    {loading ? <p role="status" className="text-sm text-muted-foreground">Cargando organizaciones…</p> : null}
    {error ? <div role="alert" className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"><p>{error}</p><Button variant="outline" onClick={() => { setLoading(true); setError(""); setRevision(value => value + 1); }}>Reintentar</Button></div> : null}
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5" aria-hidden="true" /></span>
          <div><label htmlFor="invitation-organization" className="text-sm font-semibold">Organización</label><p id="organization-help" className="mt-1 text-sm text-muted-foreground">Elige dónde quieres invitar y administrar personas.</p></div>
        </div>
        <div className="w-full sm:max-w-sm">
          <Select value={selected || null} onValueChange={value => setSelected(value ?? "")} disabled={pending || loading || !!error || !organizations.length} items={organizations.map(org => ({ value: org.id, label: org.name }))}>
            <SelectTrigger id="invitation-organization" aria-describedby="organization-help" className="h-10"><SelectValue placeholder="Selecciona una organización" /></SelectTrigger>
            <SelectContent>{organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
    {!loading && !error && !selected ? <Card><CardContent className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted"><MailPlus className="size-6 text-muted-foreground" aria-hidden="true" /></span>
      <h2 className="text-base font-semibold">{organizations.length ? "Invita a tu equipo a Hemia" : "No hay organizaciones activas"}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{organizations.length ? "Selecciona la organización a la que se unirá la persona invitada." : "Necesitas una organización activa para enviar invitaciones."}</p>
    </CardContent></Card> : null}
    {!loading && !error && selected ? <InvitationForm key={selected} organizationId={selected} locale={locale} onPendingChange={setPending} /> : null}
  </div>;
}
