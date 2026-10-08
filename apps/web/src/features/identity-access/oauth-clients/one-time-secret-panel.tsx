"use client";

import { AlertTriangle, ArrowRight, Check, Copy, KeyRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import type { OneTimeOAuthSecret } from "./types";

export function OneTimeSecretPanel({
  onDismiss,
  returnHref,
  secret,
}: {
  onDismiss?: () => void;
  returnHref?: string;
  secret: OneTimeOAuthSecret;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const details = [
    { label: "Client ID", value: secret.clientId },
    { label: "Audience", value: secret.audience },
    { label: "Tipo", value: secret.type ? (secret.type === "confidential" ? "Confidencial" : "Público") : undefined },
    { label: "Estado", value: secret.status ? ({ active: "Activo", suspended: "Suspendido", deleted: "Eliminado" })[secret.status] : undefined },
  ].filter((detail) => detail.value);

  async function copySecret() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(secret.clientSecret);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <Card className="overflow-hidden rounded-lg shadow-sm">
      <div className="flex items-start gap-3 border-b border-border p-5 sm:p-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-zuno-success-surface text-zuno-success">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{secret.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Guarda el secreto para conectar tu aplicación a Hemia.</p>
        </div>
        {onDismiss ? (
          <Button aria-label="Cerrar secreto" className="size-10 shrink-0" onClick={onDismiss} type="button" variant="ghost">
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-md bg-zuno-warning-surface p-4 text-zuno-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Este secreto se muestra una sola vez</p>
            <p className="mt-1 text-sm leading-6">Cópialo y guárdalo en un lugar seguro antes de salir. No podrás consultarlo de nuevo.</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-muted-foreground" aria-hidden="true" />Client secret
            </h3>
            <Button aria-label={copied ? "Secreto copiado" : "Copiar secreto"} className="h-10" onClick={copySecret} type="button" variant="outline">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              <span role="status">{copied ? "Secreto copiado" : "Copiar secreto"}</span>
            </Button>
          </div>
          <p className="select-all break-all rounded-md border border-input bg-muted/40 p-4 font-mono text-sm leading-7 text-foreground sm:p-5">{secret.clientSecret}</p>
          {copyError ? <p className="mt-2 text-sm text-destructive" role="alert">No se pudo copiar. Selecciona el secreto y cópialo manualmente.</p> : null}
        </div>

        {details.length ? (
          <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                <dd className="mt-1 break-all text-sm font-medium">{detail.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {returnHref ? (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs leading-5 text-muted-foreground">Asegúrate de guardar el secreto antes de finalizar.</p>
          <Button className="h-10 w-full shrink-0 sm:w-auto" render={<Link href={returnHref} />}>
            Finalizar<ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
