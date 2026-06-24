"use client";

import { Check, Copy, KeyRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  const details = [
    { label: "Client ID", value: secret.clientId },
    { label: "Audience", value: secret.audience },
    { label: "Type", value: secret.type },
    { label: "Estado", value: secret.status },
  ].filter((detail) => detail.value);

  async function copySecret() {
    await navigator.clipboard.writeText(secret.clientSecret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card className="border-primary/20 bg-secondary/70">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <KeyRound className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">{secret.title}</h2>
              <p className="mt-1 text-sm leading-6 text-supporting">
                Copia este secreto ahora. Console no puede mostrarlo otra vez.
              </p>
              {details.length ? (
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  {details.map((detail) => (
                    <div key={detail.label} className="min-w-0 rounded-md bg-background px-3 py-2">
                      <dt className="font-semibold text-muted-foreground">{detail.label}</dt>
                      <dd className="mt-1 break-all font-semibold text-foreground">
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button className="h-12" onClick={copySecret} type="button" variant="outline">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            {onDismiss ? (
              <Button
                aria-label="Cerrar secreto"
                className="size-12"
                onClick={onDismiss}
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 rounded-md border border-primary/20 bg-background p-3 font-mono text-sm text-foreground">
          <p className="break-all">{secret.clientSecret}</p>
        </div>
        {returnHref ? (
          <div className="mt-4 flex justify-end">
            <Link
              className={cn(buttonVariants({ variant: "default" }), "h-12 gap-2")}
              href={returnHref}
            >
              Finalizar
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
