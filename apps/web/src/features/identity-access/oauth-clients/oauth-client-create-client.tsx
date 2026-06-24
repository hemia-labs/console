"use client";

import { useState } from "react";

import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { createOAuthClient } from "./api";
import { OAuthClientForm } from "./oauth-client-form";
import { OneTimeSecretPanel } from "./one-time-secret-panel";
import type { CreateOAuthClientPayload, OneTimeOAuthSecret, UpdateOAuthClientPayload } from "./types";

export function OAuthClientCreateClient({ cancelHref }: { cancelHref: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);

  async function handleSubmit(payload: CreateOAuthClientPayload | UpdateOAuthClientPayload) {
    setError(null);
    setPending(true);
    setSecret(null);

    try {
      const response = await createOAuthClient(payload as CreateOAuthClientPayload);
      if (response.clientSecret) {
        setSecret({
          audience: response.audience ?? payload.audience,
          clientId: response.clientId ?? payload.clientId,
          clientSecret: response.clientSecret,
          status: response.status ?? payload.status,
          title: "Secreto creado",
          type: response.type ?? payload.type,
        });
      }
    } catch (error) {
      setError(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {secret ? <OneTimeSecretPanel returnHref={cancelHref} secret={secret} /> : null}
      {secret ? null : (
        <OAuthClientForm
          cancelHref={cancelHref}
          error={error}
          mode="create"
          onSubmit={handleSubmit}
          pending={pending}
        />
      )}
    </div>
  );
}
