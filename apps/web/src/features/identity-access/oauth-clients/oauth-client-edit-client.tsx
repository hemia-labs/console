"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(payload: CreateOAuthClientPayload | UpdateOAuthClientPayload) {
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
    <OAuthClientForm
      cancelHref={cancelHref}
      client={client}
      error={error}
      mode="edit"
      onSubmit={handleSubmit}
      pending={pending}
    />
  );
}
