"use client";

import {
  CheckCircle2,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Trash2,
  UnlockKeyhole,
  UserX,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { IdentityStatusBadge } from "@/features/identity-access/components/identity-status-badge";
import type { IdentityUser, UserStatus } from "@/features/identity-access/types";
import { userDate, userDisplayName, userId, userInitials, userStatus } from "./user-utils";

export function UsersTable({
  onDelete,
  onEdit,
  onLock,
  onStatus,
  onUnlock,
  pendingUserId,
  users,
}: {
  onDelete: (user: IdentityUser) => void;
  onEdit: (user: IdentityUser) => void;
  onLock: (user: IdentityUser) => void;
  onStatus: (user: IdentityUser, status: UserStatus) => void;
  onUnlock: (user: IdentityUser) => void;
  pendingUserId?: string | null;
  users: IdentityUser[];
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        description="Ajusta los filtros o crea un usuario para comenzar."
        title="Sin usuarios"
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Usuario
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Creado
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
            {users.map((user) => {
              const id = userId(user);
              const status = userStatus(user);
              const pending = pendingUserId === id;

              return (
                <TableRow key={id || user.email || userDisplayName(user)}>
                  <TableCell className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="lg" className="bg-secondary text-primary">
                        <AvatarFallback className="bg-transparent text-xs font-bold text-inherit">
                          {userInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{userDisplayName(user)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {user.email ?? "No disponible"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <IdentityStatusBadge status={String(status)} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {userDate(user, "created")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {userDate(user, "updated")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Acciones de usuario"
                        className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                        disabled={pending || !id}
                        type="button"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          className="min-h-12 cursor-pointer gap-2 px-2"
                          onClick={() => onEdit(user)}
                        >
                          <Pencil className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {status === "locked" ? (
                          <DropdownMenuItem
                            className="min-h-12 cursor-pointer gap-2 px-2"
                            onClick={() => {
                              if (
                                window.confirm("Esta accion desbloqueara el usuario. Continuar?")
                              ) {
                                onUnlock(user);
                              }
                            }}
                          >
                            <UnlockKeyhole className="size-4" />
                            Desbloquear
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="min-h-12 cursor-pointer gap-2 px-2"
                            onClick={() => {
                              if (window.confirm("Esta accion bloqueara el usuario. Continuar?")) {
                                onLock(user);
                              }
                            }}
                          >
                            <LockKeyhole className="size-4" />
                            Bloquear
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="min-h-12 cursor-pointer gap-2 px-2"
                          onClick={() => {
                            if (window.confirm("Esta accion suspendera el usuario. Continuar?")) {
                              onStatus(user, "suspended");
                            }
                          }}
                        >
                          <UserX className="size-4" />
                          Suspender
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="min-h-12 cursor-pointer gap-2 px-2"
                          onClick={() => {
                            if (window.confirm("Esta accion activara el usuario. Continuar?")) {
                              onStatus(user, "active");
                            }
                          }}
                        >
                          <CheckCircle2 className="size-4" />
                          Activar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="min-h-12 cursor-pointer gap-2 px-2"
                          onClick={() => {
                            if (window.confirm("Esta accion eliminara el usuario. Continuar?")) {
                              onDelete(user);
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
