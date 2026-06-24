"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ErrorState } from "@/components/error-state";
import { IdentityToolbar } from "@/features/identity-access/components/identity-toolbar";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import type {
  CreateUserPayload,
  IdentityUser,
  UpdateUserPayload,
  UserStatus,
} from "@/features/identity-access/types";
import {
  createUser,
  deleteUser,
  lockUser,
  unlockUser,
  updateUser,
  updateUserStatus,
} from "@/features/identity-access/users/api";
import { UserForm } from "@/features/identity-access/users/user-form";
import { userId } from "@/features/identity-access/users/user-utils";
import { UsersTable } from "@/features/identity-access/users/users-table";

type FormState =
  | { mode: "create"; user?: undefined }
  | { mode: "edit"; user: IdentityUser }
  | null;

export function UsersClient({
  initialError,
  users,
}: {
  initialError?: string | null;
  users: IdentityUser[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function runAction(user: IdentityUser, action: () => Promise<unknown>) {
    const id = userId(user);
    setPendingUserId(id);
    setActionError(null);

    try {
      await action();
      refresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleSubmit(payload: CreateUserPayload | UpdateUserPayload) {
    setFormError(null);
    setFormPending(true);

    try {
      if (form?.mode === "edit") {
        await updateUser(userId(form.user), payload);
      } else {
        await createUser(payload as CreateUserPayload);
      }

      setForm(null);
      refresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <IdentityToolbar
        createLabel="Crear usuario"
        onCreate={() => {
          setForm({ mode: "create" });
          setFormError(null);
        }}
        searchPlaceholder="Buscar por nombre o email"
      />

      {actionError ? (
        <ErrorState
          actionLabel="Reintentar"
          error={new Error(actionError)}
          onRetry={refresh}
          title="No se pudo cargar usuarios"
        />
      ) : null}

      {form ? (
        <UserForm
          error={formError}
          mode={form.mode}
          onCancel={() => {
            setForm(null);
            setFormError(null);
          }}
          onSubmit={handleSubmit}
          pending={formPending || isPending}
          user={form.mode === "edit" ? form.user : undefined}
        />
      ) : null}

      {!actionError ? (
        <UsersTable
          onDelete={(user) => runAction(user, () => deleteUser(userId(user)))}
          onEdit={(user) => {
            setForm({ mode: "edit", user });
            setFormError(null);
          }}
          onLock={(user) => runAction(user, () => lockUser(userId(user)))}
          onStatus={(user, status: UserStatus) =>
            runAction(user, () => updateUserStatus(userId(user), status))
          }
          onUnlock={(user) => runAction(user, () => unlockUser(userId(user)))}
          pendingUserId={pendingUserId}
          users={users}
        />
      ) : null}
    </div>
  );
}
