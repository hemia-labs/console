"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBreadcrumbTitle } from "@/components/breadcrumb-context";
import { PageHeader } from "@/components/page-header";

import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { updateOAuthClient } from "./api";
import { OAuthClientForm } from "./oauth-client-form";
import type {
  CreateOAuthClientPayload,
  IdentityOAuthClient,
  UpdateOAuthClientPayload,
} from "./types";

export function OAuthClientEditClient({
  cancelHref,
  client,
}: {
  cancelHref: string;
  client: IdentityOAuthClient;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTitle } = useBreadcrumbTitle();
  useEffect(() => {
    setTitle({ pathname, label: client.clientId });
    return () => setTitle(null);
  }, [pathname, client.clientId, setTitle]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(payload: CreateOAuthClientPayload | UpdateOAuthClientPayload) {
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      await updateOAuthClient(client.id, payload);
      router.push(cancelHref);
      router.refresh();
    } catch (error) {
      setError(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar cliente OAuth" description={`Actualiza la configuración de ${client.clientId}.`} />
      <OAuthClientForm
        cancelHref={cancelHref}
        client={client}
        error={error}
        mode="edit"
        onSubmit={handleSubmit}
        pending={pending}
      />
    </div>
  );
}
