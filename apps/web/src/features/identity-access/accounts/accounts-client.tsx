"use client";

import { CheckCircle2, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import type { IdentityAccount } from "@/features/identity-access/types";
import { deleteAccount, switchAccount } from "@/features/identity-access/accounts/api";

function value(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const item = record[key];
    if (item !== undefined && item !== null && item !== "") return String(item);
  }
  return "No disponible";
}

function accountIndex(account: IdentityAccount, fallback: number) {
  const record = account as Record<string, unknown>;
  if (typeof record.accountIndex === "number") return record.accountIndex;
  if (typeof record.index === "number") return record.index;
  if (typeof record.accountIndex === "string") return Number(record.accountIndex);
  if (typeof record.index === "string") return Number(record.index);
  return fallback;
}

function activeAccountIndex(activeAccount?: IdentityAccount | null) {
  if (!activeAccount) return null;
  const session = activeAccount.session;
  if (session && typeof session === "object") {
    const activeIndex = (session as Record<string, unknown>).activeAccountIndex;
    if (typeof activeIndex === "number") return activeIndex;
    if (typeof activeIndex === "string") return Number(activeIndex);
  }
  return accountIndex(activeAccount, -1);
}

export function AccountsClient({
  accounts,
  activeAccount,
  initialError,
}: {
  accounts: IdentityAccount[];
  activeAccount?: IdentityAccount | null;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeIndex = activeAccountIndex(activeAccount);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function runAction(index: number, action: () => Promise<unknown>, success: string) {
    setPendingIndex(index);
    setActionError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      refresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setPendingIndex(null);
    }
  }

  if (actionError) {
    return (
      <ErrorState
        actionLabel="Reintentar"
        error={new Error(actionError)}
        onRetry={refresh}
        title="No se pudo cargar cuentas"
      />
    );
  }

  if (accounts.length === 0) {
    return <EmptyState description="Cuando haya cuentas conectadas apareceran aqui." title="Sin cuentas" />;
  }

  return (
    <div className="space-y-5">
      {message ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Cuenta</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Email</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Tenant</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</TableHead>
                <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account, fallbackIndex) => {
                const index = accountIndex(account, fallbackIndex);
                const active = activeIndex === index;
                const pending = pendingIndex === index || isPending;
                const record = account as Record<string, unknown>;
                return (
                  <TableRow key={`${index}-${account.id ?? account.email ?? fallbackIndex}`}>
                    <TableCell className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-semibold">
                          {value(record, ["name", "displayName", "organizationName"])}
                        </span>
                        {active ? <StatusBadge label="Activa" tone="success" /> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">Index {index}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{value(record, ["email", "userEmail"])}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{value(record, ["tenantName", "tenantSlug", "tenantId"])}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{value(record, ["status", "state"])}</TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Acciones de cuenta"
                          className="inline-flex size-12 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                          disabled={pending || Number.isNaN(index)}
                          type="button"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            className="min-h-12 cursor-pointer gap-2 px-2"
                            onClick={() => {
                              if (window.confirm("Cambiar cuenta activa?")) {
                                runAction(index, () => switchAccount(index), "Cuenta activa actualizada.");
                              }
                            }}
                          >
                            {active ? <CheckCircle2 className="size-4" /> : <RefreshCw className="size-4" />}
                            {active ? "Cuenta activa" : "Cambiar a esta cuenta"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="min-h-12 cursor-pointer gap-2 px-2"
                            onClick={() => {
                              if (window.confirm("Esta accion eliminara la cuenta conectada. Continuar?")) {
                                runAction(index, () => deleteAccount(index), "Cuenta eliminada.");
                              }
                            }}
                            variant="destructive"
                          >
                            <Trash2 className="size-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
