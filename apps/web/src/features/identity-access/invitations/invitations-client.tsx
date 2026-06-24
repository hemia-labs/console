"use client";

import { RefreshCw, Send, XCircle } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import type { CreateInvitationPayload } from "@/features/identity-access/types";
import {
  cancelInvitation,
  createInvitation,
  resendInvitation,
} from "@/features/identity-access/invitations/api";

function initialForm(): CreateInvitationPayload {
  return {
    email: "",
    expiresAt: "",
    message: "",
    organizationId: "",
    redirectUrl: "",
    roleId: "",
    teamId: "",
  };
}

export function InvitationsClient() {
  const [form, setForm] = useState(initialForm);
  const [invitationId, setInvitationId] = useState("");
  const [pending, setPending] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof CreateInvitationPayload>(key: K, value: CreateInvitationPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      await createInvitation({
        email: form.email.trim(),
        expiresAt: form.expiresAt?.trim(),
        message: form.message?.trim(),
        organizationId: form.organizationId?.trim(),
        redirectUrl: form.redirectUrl?.trim(),
        roleId: form.roleId?.trim(),
        teamId: form.teamId?.trim(),
      });
      setForm(initialForm());
      setMessage("Invitacion creada.");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function runInvitationAction(kind: "cancel" | "resend") {
    if (!invitationId.trim()) return;
    const label = kind === "cancel" ? "cancelar" : "reenviar";
    if (!window.confirm(`Esta accion va a ${label} la invitacion. Continuar?`)) return;

    setError(null);
    setMessage(null);
    setActionPending(true);
    try {
      if (kind === "cancel") await cancelInvitation(invitationId.trim());
      else await resendInvitation(invitationId.trim());
      setMessage(kind === "cancel" ? "Invitacion cancelada." : "Invitacion reenviada.");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
        <h2 className="text-lg font-semibold">Crear invitacion</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input className="h-12 bg-card" onChange={(e) => update("email", e.target.value)} required type="email" value={form.email} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Expires at
            <Input className="h-12 bg-card" onChange={(e) => update("expiresAt", e.target.value)} placeholder="2026-07-01T00:00:00.000Z" value={form.expiresAt ?? ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Organization ID
            <Input className="h-12 bg-card" onChange={(e) => update("organizationId", e.target.value)} value={form.organizationId ?? ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Team ID
            <Input className="h-12 bg-card" onChange={(e) => update("teamId", e.target.value)} value={form.teamId ?? ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Role ID
            <Input className="h-12 bg-card" onChange={(e) => update("roleId", e.target.value)} value={form.roleId ?? ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Redirect URL
            <Input className="h-12 bg-card" onChange={(e) => update("redirectUrl", e.target.value)} value={form.redirectUrl ?? ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Mensaje
            <Textarea className="min-h-24 bg-card" onChange={(e) => update("message", e.target.value)} value={form.message ?? ""} />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <Button className="h-12" disabled={pending} type="submit">
            <Send className="size-4" />
            {pending ? "Enviando..." : "Crear invitacion"}
          </Button>
        </div>
      </form>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Reenviar o cancelar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Console API aun no expone listado de invitaciones; usa el ID de invitacion para estas acciones.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input className="h-12 bg-card" onChange={(e) => setInvitationId(e.target.value)} placeholder="Invitation ID" value={invitationId} />
          <Button className="h-12" disabled={actionPending || !invitationId.trim()} onClick={() => runInvitationAction("resend")} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Reenviar
          </Button>
          <Button className="h-12" disabled={actionPending || !invitationId.trim()} onClick={() => runInvitationAction("cancel")} type="button" variant="destructive">
            <XCircle className="size-4" />
            Cancelar
          </Button>
        </div>
      </section>

      {error ? <p className="rounded-lg border border-destructive bg-red-50 p-4 text-sm font-medium text-destructive">{error}</p> : null}
      {message ? <p className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-emerald-700">{message}</p> : null}
      <EmptyState
        description="No hay listado porque falta GET /identity-access/invitations en Console API."
        title="Listado no disponible"
      />
    </div>
  );
}
