"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/zuno/button";

export function RecoveredConfiguration({
  configured,
  label,
  summary,
  children,
  collapsible = false,
}: {
  configured: boolean;
  label: string;
  summary: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  if (!configured || editing) return <>{children}</>;
  const content = (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 p-4">
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium">
          {label}{" "}
          <span className="ml-2 text-xs font-normal text-primary">
            Configurado
          </span>
        </p>
        <div className="break-words text-muted-foreground">{summary}</div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        aria-label={`Cambiar ${label}`}
        onClick={() => setEditing(true)}
      >
        Cambiar
      </Button>
    </div>
  );
  return collapsible ? (
    <details className="rounded-lg border border-border p-3">
      <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-ring">
        {label} · Configurado
      </summary>
      {content}
    </details>
  ) : content;
}
