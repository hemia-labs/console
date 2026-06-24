"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  PowerOff,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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
import { localizedHref } from "@/lib/nav";
import { OAuthClientStatusBadge } from "./oauth-client-status-badge";
import type { IdentityOAuthClient, OAuthClientStatus } from "./types";
import {
  joinList,
  oauthClientDate,
  oauthClientId,
  oauthClientStatus,
} from "./oauth-client-utils";

export function OAuthClientsTable({
  clients,
  locale,
  onDelete,
  onRotateSecret,
  onStatus,
  pendingClientId,
}: {
  clients: IdentityOAuthClient[];
  locale: string;
  onDelete: (client: IdentityOAuthClient) => void;
  onRotateSecret: (client: IdentityOAuthClient) => void;
  onStatus: (client: IdentityOAuthClient, status: OAuthClientStatus) => void;
  pendingClientId?: string | null;
}) {
  if (clients.length === 0) {
    return (
      <EmptyState
        description="Ajusta los filtros o crea un OAuth client para comenzar."
        title="Sin OAuth clients"
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Client ID
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Audience
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Redirect URIs
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Scopes
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Actualizado
              </TableHead>
              <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const id = oauthClientId(client);
              const status = oauthClientStatus(client);
              const pending = pendingClientId === id;

              return (
                <TableRow key={id || client.clientId}>
                  <TableCell className="px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        className="block truncate text-sm font-semibold text-primary hover:underline"
                        href={localizedHref(locale, `/identity-access/oauth-clients/${id}`)}
                      >
                        {client.clientId}
                      </Link>
                      {id && id !== client.clientId ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{id}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] px-4 py-3 text-sm">
                    <p className="truncate">{client.audience || "No disponible"}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm capitalize">{client.type}</TableCell>
                  <TableCell className="px-4 py-3">
                    <OAuthClientStatusBadge status={status} />
                  </TableCell>
                  <TableCell className="max-w-[220px] px-4 py-3 text-sm text-muted-foreground">
                    <p className="truncate">{joinList(client.redirectUris)}</p>
                  </TableCell>
                  <TableCell className="max-w-[180px] px-4 py-3 text-sm text-muted-foreground">
                    <p className="truncate">{joinList(client.scopes)}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {oauthClientDate(client, "updated")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Acciones de OAuth client"
                        className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                        disabled={pending || !id}
                        type="button"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2">
                          <Link
                            className="flex w-full items-center gap-2"
                            href={localizedHref(locale, `/identity-access/oauth-clients/${id}`)}
                          >
                            <Eye className="size-4" />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2">
                          <Link
                            className="flex w-full items-center gap-2"
                            href={localizedHref(
                              locale,
                              `/identity-access/oauth-clients/${id}/edit`
                            )}
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="min-h-12 cursor-pointer gap-2 px-2"
                          onClick={() => {
                            if (window.confirm("Esta accion rotara el secreto. Continuar?")) {
                              onRotateSecret(client);
                            }
                          }}
                        >
                          <KeyRound className="size-4" />
                          Rotar secreto
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {status === "active" ? (
                          <DropdownMenuItem
                            className="min-h-12 cursor-pointer gap-2 px-2"
                            onClick={() => {
                              if (window.confirm("Esta accion suspendera el client. Continuar?")) {
                                onStatus(client, "suspended");
                              }
                            }}
                          >
                            <PowerOff className="size-4" />
                            Suspender
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="min-h-12 cursor-pointer gap-2 px-2"
                            onClick={() => {
                              if (window.confirm("Esta accion activara el client. Continuar?")) {
                                onStatus(client, "active");
                              }
                            }}
                          >
                            <CheckCircle2 className="size-4" />
                            Activar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="min-h-12 cursor-pointer gap-2 px-2"
                          onClick={() => {
                            if (window.confirm("Esta accion eliminara el client. Continuar?")) {
                              onDelete(client);
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
  );
}
