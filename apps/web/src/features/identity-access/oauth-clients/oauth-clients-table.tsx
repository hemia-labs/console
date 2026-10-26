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
import { Button } from "@/components/zuno/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/zuno/dropdown-menu";
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

const MAX_VISIBLE_ITEMS = 2;

function MoreLabel({ count, noun, title }: { count: number; noun: string; title: string }) {
  return (
    <p className="text-xs font-medium text-muted-foreground" title={title}>
      +{count} {noun}
      {count === 1 ? "" : "s"} más
    </p>
  );
}

export function OAuthClientsTable({
  clients,
  locale,
  onDelete,
  onRotateSecret,
  onStatus,
  pendingClientId,
  isFiltered = false,
  onClearFilters,
}: {
  clients: IdentityOAuthClient[];
  locale: string;
  onDelete: (client: IdentityOAuthClient) => void;
  onRotateSecret: (client: IdentityOAuthClient) => void;
  onStatus: (client: IdentityOAuthClient, status: OAuthClientStatus) => void;
  pendingClientId?: string | null;
  isFiltered?: boolean;
  onClearFilters: () => void;
}) {
  if (clients.length === 0) {
    return (
      <EmptyState
        className="min-h-64 rounded-none border-0 shadow-none"
        icon={<KeyRound className="size-5" />}
        description={isFiltered ? "Prueba con otra búsqueda o elimina los filtros aplicados." : "Crea un cliente para conectar tu primera aplicación a Hemia."}
        title={isFiltered ? "Sin resultados" : "Aún no hay clientes OAuth"}
        action={isFiltered ? (
          <Button className="h-10" onClick={onClearFilters} variant="outline">Limpiar filtros</Button>
        ) : (
          <Button className="h-10" render={<Link href={localizedHref(locale, "/identity/oauth-clients/new")} />}>Crear OAuth client</Button>
        )}
      />
    );
  }

  return (
    <Table className="min-w-[1280px] table-fixed">
      <colgroup>
        <col className="w-[18%]" />
        <col className="w-[18%]" />
        <col className="w-[8%]" />
        <col className="w-[8%]" />
        <col className="w-[12%]" />
        <col className="w-[18%]" />
        <col className="w-[12%]" />
        <col className="w-[6%]" />
      </colgroup>
      <TableHeader>
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
            Client ID
          </TableHead>
          <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
            Audiencias / destinos
          </TableHead>
          <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
            Tipo
          </TableHead>
          <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
            Estado
          </TableHead>
          <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
            Redirecciones
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
          const destinations = client.serviceDestinations ?? [];
          const extraDestinations = Math.max(destinations.length - MAX_VISIBLE_ITEMS, 0);
          const scopes = destinations.length
            ? Array.from(new Set(destinations.flatMap((destination) => destination.scopes)))
            : (client.scopes ?? []);
          const extraScopes = Math.max(scopes.length - MAX_VISIBLE_ITEMS, 0);

          return (
            <TableRow className="h-[72px] hover:bg-muted/30" key={id || client.clientId}>
              <TableCell className="px-4 py-3">
                <Link
                  className="block max-w-52 truncate text-sm font-semibold text-foreground hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  title={client.clientId}
                  href={localizedHref(locale, `/identity/oauth-clients/${id}`)}
                >
                  {client.clientId}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {destinations.length ? (
                  <div className="space-y-1">
                    {destinations.slice(0, MAX_VISIBLE_ITEMS).map((destination) => (
                      <p
                        className="truncate font-medium"
                        key={destination.resource}
                        title={`${destination.audience} · ${destination.resource}`}
                      >
                        {destination.audience}
                      </p>
                    ))}
                    {extraDestinations > 0 ? (
                      <MoreLabel
                        count={extraDestinations}
                        noun="destino"
                        title={destinations
                          .map((destination) => `${destination.audience} · ${destination.resource}`)
                          .join("\n")}
                      />
                    ) : null}
                  </div>
                ) : <p className="truncate" title={client.audience}>{client.audience || "No disponible"}</p>}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">{client.type === "confidential" ? "Confidencial" : "Público"}</TableCell>
              <TableCell className="px-4 py-3">
                <OAuthClientStatusBadge status={status} />
              </TableCell>
              <TableCell className="max-w-[220px] px-4 py-3 text-sm text-muted-foreground">
                <p className="truncate" title={joinList(client.redirectUris)}>{joinList(client.redirectUris)}</p>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {scopes.length ? (
                  <div className="space-y-1">
                    {scopes.slice(0, MAX_VISIBLE_ITEMS).map((scope) => (
                      <p className="truncate font-mono text-xs leading-5" key={scope} title={scope}>
                        {scope}
                      </p>
                    ))}
                    {extraScopes > 0 ? (
                      <MoreLabel count={extraScopes} noun="scope" title={scopes.join("\n")} />
                    ) : null}
                  </div>
                ) : <p className="text-xs">Sin scopes</p>}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {oauthClientDate(client, "updated")}
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`Acciones de ${client.clientId}`}
                    render={<Button className="size-10" size="icon" variant="ghost" />}
                    disabled={pending || !id}
                    type="button"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuItem className="min-h-10 cursor-pointer gap-2 px-2" render={<Link href={localizedHref(locale, `/identity/oauth-clients/${id}`)} />}>
                      <Eye className="size-4" />
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem className="min-h-10 cursor-pointer gap-2 px-2" render={<Link href={localizedHref(locale, `/identity/oauth-clients/${id}/edit`)} />}>
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="min-h-10 cursor-pointer gap-2 px-2"
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
                        className="min-h-10 cursor-pointer gap-2 px-2"
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
                        className="min-h-10 cursor-pointer gap-2 px-2"
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
                      className="min-h-10 cursor-pointer gap-2 px-2"
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
  );
}
