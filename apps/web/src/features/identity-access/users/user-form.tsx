"use client";

import { Save, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CreateUserPayload,
  IdentityUser,
  UpdateUserPayload,
  UserStatus,
} from "@/features/identity-access/types";

const statusOptions: { label: string; value: UserStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Bloqueado", value: "locked" },
  { label: "Eliminado", value: "deleted" },
];

type UserFormState = CreateUserPayload & { id?: string };

function initialState(user?: IdentityUser): UserFormState {
  return {
    displayName: user?.displayName ? String(user.displayName) : "",
    email: user?.email ? String(user.email) : "",
    firstName: user?.firstName ? String(user.firstName) : "",
    id: user?.id ? String(user.id) : user?.sub ? String(user.sub) : undefined,
    lastName: user?.lastName ? String(user.lastName) : "",
    name: user?.name ? String(user.name) : "",
    password: "",
    status: (user?.status as UserStatus | undefined) ?? "active",
  };
}

export function UserForm({
  error,
  mode,
  onCancel,
  onSubmit,
  pending,
  user,
}: {
  error?: string | null;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
  pending?: boolean;
  user?: IdentityUser;
}) {
  const [form, setForm] = useState<UserFormState>(() => initialState(user));

  function update<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      displayName: form.displayName?.trim(),
      email: form.email.trim(),
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      name: form.name?.trim(),
      password: form.password?.trim(),
      status: form.status,
    };

    await onSubmit(payload);
  }

  return (
    <form
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "Crear usuario" : "Editar usuario"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Alta administrativa en Hemia ID desde Console API."
            : "Actualiza campos administrativos del usuario seleccionado."}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Email
          <Input
            aria-invalid={Boolean(error && !form.email)}
            className="h-12 bg-card"
            onChange={(event) => update("email", event.target.value)}
            required={mode === "create"}
            type="email"
            value={form.email}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("password", event.target.value)}
            placeholder={mode === "edit" ? "Dejar vacio para no cambiar" : ""}
            type="password"
            value={form.password}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Nombre
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("firstName", event.target.value)}
            value={form.firstName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Apellido
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("lastName", event.target.value)}
            value={form.lastName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Nombre completo
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("name", event.target.value)}
            value={form.name}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Display name
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("displayName", event.target.value)}
            value={form.displayName}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Estado
          <select
            className="h-12 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onChange={(event) => update("status", event.target.value as UserStatus)}
            value={form.status}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          className="h-12"
          disabled={pending}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          <X className="size-4" />
          Cancelar
        </Button>
        <Button className="h-12" disabled={pending} type="submit">
          <Save className="size-4" />
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
