"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Plus, RefreshCw, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/zuno/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/zuno/card";
import { Badge } from "@/components/zuno/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { consoleApi } from "@/lib/console-api";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { invitationStatuses, type Invitation, type InvitationPage } from "./invitation-types";

export function InvitationsClient({ locale = "es", page = 1, organizationId }: { locale?: string; page?: number; organizationId?: string }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);
  const [revision, setRevision] = useState(0);
  const limit = 25;
  const offset = (page - 1) * limit;
  const listHref = `/${locale}/access/invitations`;
  const newHref = `${listHref}/new${organizationId ? `?organization=${encodeURIComponent(organizationId)}` : ""}`;
  const pageHref = (number: number) => `${listHref}?page=${number}${organizationId ? `&organization=${encodeURIComponent(organizationId)}` : ""}`;

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setItems([]);
    consoleApi.get<InvitationPage>("/access/invitations", { query: { limit, offset, organization_id: organizationId } })
      .then(data => { if (active) { setItems(data.items); setTotal(data.total); } })
      .catch(e => { if (active) setError(apiErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, organizationId, revision]);

  async function action(id: string, action: "resend" | "revoke") {
    setPending(true); setError(""); setMessage("");
    try {
      const result = await consoleApi.post<Invitation>(`/access/invitations/${id}/${action}`);
      setMessage(action === "revoke" ? "Invitación revocada." : result.delivery === "sent" ? "Invitación reenviada. El enlace anterior dejó de funcionar." : "El reenvío falló. Intenta de nuevo.");
      setRevision(value => value + 1);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setPending(false); setRevokeTarget(null); }
  }

  return <section className="space-y-5" aria-label="Listado de invitaciones" aria-busy={loading || pending}>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{organizationId ? "Invitaciones de esta organización" : "Organizaciones disponibles"}</p><Button render={<Link href={newHref} />}><Plus className="size-4" aria-hidden="true" />Nueva invitación</Button></div>
    {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p> : null}
    {message ? <p role="status" className="rounded-lg border border-border bg-muted/50 p-4 text-sm">{message}</p> : null}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="space-y-1"><CardTitle>Invitaciones</CardTitle><CardDescription>Consulta destinatarios, organizaciones y estados de acceso.</CardDescription></div>
          {!loading ? <Badge variant="secondary">{total} {total === 1 ? "invitación" : "invitaciones"}</Badge> : null}
        </CardHeader>
        {loading ? <div role="status" className="flex items-center justify-center gap-2 border-t px-6 py-16 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Cargando invitaciones…</div> : error ? null : items.length ? <Table>
          <TableHeader><TableRow className="bg-muted/40"><TableHead className="pl-6">Destinatario</TableHead><TableHead>Organización</TableHead><TableHead>Estado</TableHead><TableHead>Vencimiento</TableHead><TableHead className="pr-6 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>{items.map(item => <TableRow key={item.id}>
            <TableCell className="max-w-64 py-4 pl-6"><p className="break-all font-medium whitespace-normal">{item.emailNormalized}</p></TableCell>
            <TableCell className="max-w-48 whitespace-normal text-muted-foreground">{item.organizationName ?? "—"}</TableCell>
            <TableCell><Badge variant="outline" className={item.status === "pending" ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300" : item.status === "accepted" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "bg-muted text-muted-foreground"}>{invitationStatuses[item.status] ?? item.status}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground"><time dateTime={item.expiresAt}>{new Date(item.expiresAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</time></TableCell>
            <TableCell className="pr-6">{item.status === "pending" ? <div className="flex justify-end gap-1">
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void action(item.id, "resend")} aria-label={`Reenviar invitación a ${item.emailNormalized}`}><RefreshCw className="size-3.5" aria-hidden="true" />Reenviar</Button>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={pending} onClick={() => setRevokeTarget(item)} aria-label={`Revocar invitación a ${item.emailNormalized}`}><Ban className="size-3.5" aria-hidden="true" />Revocar</Button>
            </div> : <span className="block text-right text-xs text-muted-foreground">Sin acciones</span>}</TableCell>
          </TableRow>)}</TableBody>
        </Table> : <div className="flex flex-col items-center border-t px-6 py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted"><Mail className="size-5 text-muted-foreground" aria-hidden="true" /></span>
          <p className="text-sm font-medium">{offset ? "No hay invitaciones en esta página" : "Aún no hay invitaciones"}</p><p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">{offset ? "Vuelve a la página anterior para consultar las invitaciones." : "Las invitaciones que envíes aparecerán aquí para consultar su estado."}</p>
        </div>}
        {error ? <div className="border-t p-4"><Button type="button" variant="outline" disabled={pending || loading} onClick={() => setRevision(value => value + 1)}><RefreshCw className="size-4" aria-hidden="true" />Actualizar lista</Button></div> : null}
      </Card>

    {!loading && !error && total > 0 ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><p>{items.length ? offset + 1 : 0}–{items.length ? Math.min(offset + items.length, total) : 0} de {total}</p><div className="flex gap-2"><Button variant="outline" disabled={pending || page <= 1} render={<Link href={pageHref(page - 1)} />}><ChevronLeft className="size-4" aria-hidden="true" />Anterior</Button><Button variant="outline" disabled={pending || offset + limit >= total} render={<Link href={pageHref(page + 1)} />}>Siguiente<ChevronRight className="size-4" aria-hidden="true" /></Button></div></div> : null}
    <AlertDialog open={!!revokeTarget} onOpenChange={open => { if (!open && !pending) setRevokeTarget(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>¿Revocar invitación?</AlertDialogTitle><AlertDialogDescription>El enlace enviado a <span className="break-all font-medium text-foreground">{revokeTarget?.emailNormalized}</span> dejará de funcionar. Podrás enviar una nueva invitación después.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={() => { if (revokeTarget) void action(revokeTarget.id, "revoke"); }}>{pending ? "Revocando…" : "Revocar invitación"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
