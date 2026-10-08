"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, CheckCircle2, Copy, KeyRound, MoreHorizontal, Pencil, PowerOff, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useBreadcrumbTitle } from "@/components/breadcrumb-context";
import { localizedHref } from "@/lib/nav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/zuno/dropdown-menu";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderDescription, PageHeaderHeading } from "@/components/zuno/page-header";

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
import { Button } from "@/components/zuno/button";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import {
  deleteOAuthClient,
  removeOAuthClientListValue,
  rotateOAuthClientSecret,
  updateOAuthClient,
} from "./api";
import { OAuthServiceDestinations } from "./oauth-service-destinations";
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

const listSections: Array<{
  field: ListField;
  label: string;
}> = [
  {
    field: "redirectUris",
    label: "URLs de redirección",
  },
  { field: "scopes", label: "Scopes" },
  {
    field: "grantTypes",
    label: "Grant types",
  },
  { field: "responseTypes", label: "Response types" },
];

function CopyClientIdButton({ value, onError }: {
  value: string;
  onError: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      if (timer.current !== null) clearTimeout(timer.current);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      onError();
    }
  }

  return (
    <Button aria-label={copied ? "ID del cliente copiado" : "Copiar ID del cliente"} className="size-10 shrink-0" onClick={copy} size="icon" variant="ghost">
      {copied ? <Check className="size-4 text-zuno-success" /> : <Copy className="size-4" />}
    </Button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function RemovableList({
  disabled,
  label,
  onRemove,
  values,
}: {
  disabled?: boolean;
  label: string;
  onRemove: (value: string) => Promise<void>;
  values?: string[];
}) {
  const items = values ?? [];
  const inputId = useId();

  return (
    <section className="grid gap-4 p-5 lg:grid-cols-[13rem_minmax(0,1fr)]" aria-labelledby={`${inputId}-heading`}>
      <div>
        <h3 className="text-sm font-semibold" id={`${inputId}-heading`}>{label}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{items.length} {items.length === 1 ? "valor configurado" : "valores configurados"}</p>
      </div>
      <div className="min-w-0 space-y-3">
        {items.length ? (
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                className="flex min-h-10 min-w-0 items-center justify-between gap-3 border-b border-border py-1 last:border-0"
                key={item}
              >
                <span className="min-w-0 break-all font-mono text-xs">
                  {item}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger
                    aria-label={`Eliminar ${item}`}
                    disabled={disabled}
                    render={
                      <Button
                        className="size-10"
                        type="button"
                        variant="ghost"
                      />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar {label}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará este valor de la configuración del cliente. Puedes volver a agregarlo después.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-10" disabled={disabled}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="h-10 bg-zuno-destructive-solid text-zuno-destructive-solid-foreground hover:bg-zuno-destructive-solid/90"
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
  onRefresh,
  locale,
}: {
  client: IdentityOAuthClient;
  locale: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [client, setClient] = useState(initialClient);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<"secret" | "status" | null>(null);
  const { setTitle } = useBreadcrumbTitle();
  useEffect(() => {
    setTitle({ pathname, label: initialClient.clientId });
    return () => setTitle(null);
  }, [pathname, initialClient.clientId, setTitle]);
  const status = oauthClientStatus(client);
  const disabled = Boolean(pendingKey);

  async function save(
    payload: UpdateOAuthClientPayload,
    nextClient: IdentityOAuthClient,
    key: string
  ) {
    setError(null);
    setMessage(null);
    setPendingKey(key);

    try {
      await updateOAuthClient(client.id, payload);
      setClient(nextClient);
      setMessage("Estado del cliente actualizado.");
      onRefresh();
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
    setMessage(null);
    setPendingKey(`${field}:remove`);

    try {
      await removeOAuthClientListValue(client.id, field, value);
      setClient({
        ...client,
        [field]: current.filter((item) => item !== value),
      });
      setMessage("Valor eliminado de la configuración.");
      onRefresh();
    } catch (error) {
      setError(apiErrorMessage(error));
    } finally {
      setPendingKey(null);
    }
  }

  async function rotateSecret() {
    setError(null);
    setMessage(null);
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
      onRefresh();
    } catch (error) {
      setError(apiErrorMessage(error));
    } finally {
      setPendingKey(null);
    }
  }

  async function toggleStatus() {
    const nextStatus: OAuthClientStatus =
      status === "active" ? "suspended" : "active";
    await save(
      { status: nextStatus },
      { ...client, status: nextStatus },
      "status"
    );
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

  const copyFeedback = {
    value: client.clientId,
    onError: () => setError("No se pudo copiar el ID. Puedes seleccionarlo y copiarlo manualmente."),
  };

  const details = [
    { label: client.serviceDestinations?.length ? "Modelo de permisos" : "Audience", value: client.serviceDestinations?.length ? "Permisos por destino" : client.audience },
    { label: "Tipo", value: client.type === "confidential" ? "Confidencial" : "Público" },
    { label: "Requiere consentimiento", value: client.requiresConsent ? "Sí" : "No" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader className="items-start sm:items-center">
        <PageHeaderContent>
          <div className="flex flex-wrap items-center gap-3">
            <PageHeaderHeading className="break-all text-2xl font-bold text-heading">{client.clientId}</PageHeaderHeading>
            <CopyClientIdButton {...copyFeedback} />
            <OAuthClientStatusBadge status={status} />
          </div>
          <PageHeaderDescription>Configuración y acceso de esta aplicación a Hemia.</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button className="h-10 px-4" render={<Link href={localizedHref(locale, `/identity/oauth-clients/${client.id}/edit`)} />}>
            <Pencil className="size-4" />Editar configuración
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Más acciones del cliente" disabled={disabled} render={<Button className="size-10" size="icon" variant="outline" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {client.type === "confidential" ? (
                <DropdownMenuItem className="min-h-10" onClick={() => setConfirmation("secret")}>
                  <KeyRound className="size-4" />Rotar secreto
                </DropdownMenuItem>
              ) : null}
              {status !== "deleted" ? (
                <DropdownMenuItem className="min-h-10" onClick={() => setConfirmation("status")}>
                  {status === "active" ? <PowerOff className="size-4" /> : <CheckCircle2 className="size-4" />}
                  {status === "active" ? "Suspender cliente" : "Activar cliente"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeaderActions>
      </PageHeader>

      {message ? <p role="status" className="text-sm text-zuno-success">{message}</p> : null}
      {error ? <ErrorState error={new Error(error)} title="No se pudo completar la acción" /> : null}
      {secret ? <OneTimeSecretPanel onDismiss={() => setSecret(null)} secret={secret} /> : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="client-overview">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold" id="client-overview">Información general</h2>
        </div>
        <dl className="grid gap-5 p-5 sm:grid-cols-3">
          {details.map((detail) => <DetailItem key={detail.label} label={detail.label} value={detail.value || "No disponible"} />)}
        </dl>
        <div className="flex flex-col gap-4 border-t border-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">ID del cliente</p>
              <p className="mt-1 break-all font-mono text-xs">{client.clientId}</p>
            </div>
            <CopyClientIdButton {...copyFeedback} />
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div><dt className="inline">Creado: </dt><dd className="inline">{oauthClientDate(client, "created")}</dd></div>
            <div><dt className="inline">Actualizado: </dt><dd className="inline">{oauthClientDate(client, "updated")}</dd></div>
          </dl>
        </div>
      </section>

      <OAuthServiceDestinations destinations={client.serviceDestinations} />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="oauth-configuration">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold" id="oauth-configuration">Configuración OAuth</h2>
          <p className="mt-1 text-sm text-muted-foreground">Agrega valores desde Editar configuración.</p>
        </div>
        <div className="divide-y divide-border">
          {listSections.filter((section) => !client.serviceDestinations?.length || section.field !== "scopes").map((section) => (
            <RemovableList
              disabled={disabled}
              key={section.field}
              label={section.label}
              onRemove={(value) => removeItem(section.field, value)}
              values={client[section.field]}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Eliminar cliente</h2>
          <p className="mt-1 text-sm text-muted-foreground">Elimina esta aplicación y su configuración OAuth.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger disabled={disabled} render={<Button className="h-10" variant="destructive" />}>
            <Trash2 className="size-4" />Eliminar cliente
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar {client.clientId}</AlertDialogTitle>
              <AlertDialogDescription>Esta acción eliminará el cliente OAuth. No se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-10" disabled={disabled}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="h-10 bg-zuno-destructive-solid text-zuno-destructive-solid-foreground hover:bg-zuno-destructive-solid/90" disabled={disabled} onClick={deleteClient}>Eliminar cliente</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation === "secret" ? "Rotar secreto" : status === "active" ? "Suspender cliente" : "Activar cliente"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === "secret"
                ? "El secreto anterior dejará de funcionar. Actualiza la aplicación con el nuevo secreto, que solo se mostrará una vez."
                : status === "active" ? "La aplicación dejará de poder iniciar nuevos flujos OAuth hasta que la actives de nuevo." : "La aplicación podrá volver a iniciar flujos OAuth."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="h-10" disabled={disabled} onClick={() => { if (confirmation === "secret") void rotateSecret(); else void toggleStatus(); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
