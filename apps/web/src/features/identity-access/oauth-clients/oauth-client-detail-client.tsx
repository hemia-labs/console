"use client";

import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Plus, PowerOff, Trash2 } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/error-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import {
  addOAuthClientListValue,
  deleteOAuthClient,
  removeOAuthClientListValue,
  rotateOAuthClientSecret,
  updateOAuthClient,
} from "./api";
import { OneTimeSecretPanel } from "./one-time-secret-panel";
import { OAuthClientStatusBadge } from "./oauth-client-status-badge";
import { oauthClientDate, oauthClientStatus } from "./oauth-client-utils";
import type {
  IdentityOAuthClient,
  OAuthClientListField,
  OAuthClientStatus,
  OneTimeOAuthSecret,
  UpdateOAuthClientPayload,
} from "./types";

type ListField = OAuthClientListField;

const listSections: Array<{ field: ListField; label: string; placeholder: string }> = [
  {
    field: "redirectUris",
    label: "Redirect URIs",
    placeholder: "https://app.hemia.cloud/callback",
  },
  { field: "scopes", label: "Scopes", placeholder: "events:read" },
  { field: "grantTypes", label: "Grant types", placeholder: "authorization_code" },
  { field: "responseTypes", label: "Response types", placeholder: "code" },
];

function isValidRedirectUri(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-surface-line py-3 last:border-b-0">
      <dt className="text-2xs font-bold uppercase tracking-normal text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function EditableList({
  disabled,
  error,
  label,
  onAdd,
  onRemove,
  pending,
  placeholder,
  values,
}: {
  disabled?: boolean;
  error?: string | null;
  label: string;
  onAdd: (value: string) => Promise<boolean>;
  onRemove: (value: string) => Promise<void>;
  pending?: boolean;
  placeholder: string;
  values?: string[];
}) {
  const [value, setValue] = useState("");
  const items = values ?? [];

  async function handleAdd() {
    if (await onAdd(value)) setValue("");
  }

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">{label}</h2>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            className="h-12 bg-card"
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAdd();
              }
            }}
            placeholder={placeholder}
            value={value}
          />
          <Button
            className="h-12 gap-2"
            disabled={disabled || pending}
            onClick={handleAdd}
            type="button"
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        {items.length ? (
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                className="flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                key={item}
              >
                <span className="min-w-0 break-all text-sm font-medium">{item}</span>
                <AlertDialog>
                  <AlertDialogTrigger
                    aria-label={`Eliminar ${item}`}
                    disabled={disabled}
                    render={
                      <Button className="size-12" type="button" variant="ghost" />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar {label}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deseas eliminar este valor? No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={disabled}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        disabled={disabled}
                        onClick={() => onRemove(item)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md bg-muted px-3 py-3 text-sm text-muted-foreground">
            No configurado
          </p>
        )}
      </div>
    </section>
  );
}

export function OAuthClientDetailClient({
  client: initialClient,
}: {
  client: IdentityOAuthClient;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [client, setClient] = useState(initialClient);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Partial<Record<ListField, string>>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);
  const status = oauthClientStatus(client);
  const disabled = Boolean(pendingKey);

  async function save(
    payload: UpdateOAuthClientPayload,
    nextClient: IdentityOAuthClient,
    key: string
  ) {
    setError(null);
    setPendingKey(key);

    try {
      await updateOAuthClient(client.id, payload);
      setClient(nextClient);
      router.refresh();
      return true;
    } catch (error) {
      setError(apiErrorMessage(error));
      return false;
    } finally {
      setPendingKey(null);
    }
  }

  async function addItem(field: ListField, value: string) {
    const nextValue = value.trim();
    const current = client[field] ?? [];

    setFieldError((errors) => ({ ...errors, [field]: null }));
    if (!nextValue) {
      setFieldError((errors) => ({ ...errors, [field]: "Ingresa un valor." }));
      return false;
    }
    if (field === "redirectUris" && !isValidRedirectUri(nextValue)) {
      setFieldError((errors) => ({ ...errors, [field]: "Ingresa una URL valida con protocolo." }));
      return false;
    }
    if (current.includes(nextValue)) {
      setFieldError((errors) => ({ ...errors, [field]: "Ese valor ya existe." }));
      return false;
    }

    setPendingKey(`${field}:add`);

    try {
      await addOAuthClientListValue(client.id, field, nextValue);
      setClient({ ...client, [field]: [...current, nextValue] });
      router.refresh();
      return true;
    } catch (error) {
      setError(apiErrorMessage(error));
      return false;
    } finally {
      setPendingKey(null);
    }
  }

  async function removeItem(field: ListField, value: string) {
    const current = client[field] ?? [];

    setError(null);
    setPendingKey(`${field}:remove`);

    try {
      await removeOAuthClientListValue(client.id, field, value);
      setClient({ ...client, [field]: current.filter((item) => item !== value) });
      router.refresh();
    } catch (error) {
      setError(apiErrorMessage(error));
    } finally {
      setPendingKey(null);
    }
  }

  async function rotateSecret() {
    setError(null);
    setPendingKey("secret");

    try {
      const response = await rotateOAuthClientSecret(client.id);
      if (response.clientSecret) {
        setSecret({
          audience: response.audience ?? client.audience,
          clientId: response.clientId ?? client.clientId,
          clientSecret: response.clientSecret,
          status: response.status ?? status,
          title: "Secreto rotado",
          type: response.type ?? client.type,
        });
      }
      router.refresh();
    } catch (error) {
      setError(apiErrorMessage(error));
    } finally {
      setPendingKey(null);
    }
  }

  async function toggleStatus() {
    const nextStatus: OAuthClientStatus = status === "active" ? "suspended" : "active";
    await save({ status: nextStatus }, { ...client, status: nextStatus }, "status");
  }

  async function deleteClient() {
    setError(null);
    setPendingKey("delete");

    try {
      await deleteOAuthClient(client.id);
      router.push(pathname.replace(/\/[^/]+$/, ""));
      router.refresh();
    } catch (error) {
      setError(apiErrorMessage(error));
      setPendingKey(null);
    }
  }

  const details = [
    { label: "Client ID", value: client.clientId },
    { label: "Audience", value: client.audience },
    { label: "Type", value: client.type },
    { label: "Estado", value: status },
    { label: "Requiere consentimiento", value: client.requiresConsent ? "Si" : "No" },
    { label: "Creado", value: oauthClientDate(client, "created") },
    { label: "Actualizado", value: oauthClientDate(client, "updated") },
  ];

  return (
    <div className="space-y-5">
      {secret ? <OneTimeSecretPanel onDismiss={() => setSecret(null)} secret={secret} /> : null}
      {error ? <ErrorState error={new Error(error)} title="No se pudo actualizar OAuth client" /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">Detalle</h2>
              <p className="mt-1 text-sm leading-6 text-supporting">
                Configuracion principal y metadatos del cliente OAuth.
              </p>
            </div>
            <OAuthClientStatusBadge status={status} />
          </div>
          <dl className="grid gap-x-6 px-5 py-2 sm:grid-cols-2">
            {details.map((detail) => (
              <DetailItem
                key={detail.label}
                label={detail.label}
                value={detail.value || "No disponible"}
              />
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold">Acciones</h2>
            <p className="mt-1 text-sm leading-6 text-supporting">
              Cambios operativos aplicados al cliente seleccionado.
            </p>
          </div>
          <div className="grid gap-3 p-5">
            <Button
              className="h-12 justify-start gap-2"
              disabled={disabled}
              onClick={rotateSecret}
              type="button"
              variant="outline"
            >
              <KeyRound className="size-4" />
              Rotar secreto
            </Button>
            <Button
              className="h-12 justify-start gap-2"
              disabled={disabled}
              onClick={toggleStatus}
              type="button"
              variant="outline"
            >
              {status === "active" ? (
                <PowerOff className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {status === "active" ? "Suspender" : "Activar"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                disabled={disabled}
                render={
                  <Button
                    className="h-12 justify-start gap-2"
                    type="button"
                    variant="destructive"
                  />
                }
              >
                <Trash2 className="size-4" />
                Eliminar
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar OAuth client</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion eliminara el cliente OAuth. No se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={disabled}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    disabled={disabled}
                    onClick={deleteClient}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {listSections.map((section) => (
          <EditableList
            disabled={disabled}
            error={fieldError[section.field]}
            key={section.field}
            label={section.label}
            onAdd={(value) => addItem(section.field, value)}
            onRemove={(value) => removeItem(section.field, value)}
            pending={pendingKey === `${section.field}:add`}
            placeholder={section.placeholder}
            values={client[section.field]}
          />
        ))}
      </div>
    </div>
  );
}
