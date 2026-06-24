import { headers } from "next/headers";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { ErrorState } from "@/components/error-state";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { getOAuthClient } from "@/features/identity-access/oauth-clients/api";
import { OAuthClientDetailClient } from "@/features/identity-access/oauth-clients/oauth-client-detail-client";
import { localizedHref } from "@/lib/nav";

async function oauthClientHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function OAuthClientDetailPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;
  const requestHeaders = await oauthClientHeaders();
  const result = await getOAuthClient(id, { headers: requestHeaders }).then(
    (client) => ({ client, error: null }),
    (error: Error) => ({ client: null, error: error.message })
  );
  const clientLabel = result.client?.clientId ?? id;

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        actions={
          result.client ? (
            <Link
              className="inline-flex h-11 w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              href={localizedHref(lang, `/identity-access/oauth-clients/${id}/edit`)}
            >
              <Pencil className="size-5" />
              Editar
            </Link>
          ) : null
        }
        breadcrumb={
          <AppBreadcrumb
            items={[
              { href: localizedHref(lang, "/"), label: "Hemia" },
              {
                href: localizedHref(lang, "/identity-access/oauth-clients"),
                label: "OAuth clients",
              },
              { label: clientLabel },
            ]}
          />
        }
        description="Consulta configuracion, listas OAuth y acciones operativas del cliente."
        title={clientLabel}
      />
      {result.error ? (
        <ErrorState error={new Error(result.error)} title="No se pudo cargar OAuth client" />
      ) : null}
      {result.client ? <OAuthClientDetailClient client={result.client} /> : null}
    </div>
  );
}
