import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { ErrorState } from "@/components/error-state";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { getOAuthClient } from "@/features/identity-access/oauth-clients/api";
import { OAuthClientEditClient } from "@/features/identity-access/oauth-clients/oauth-client-edit-client";
import { breadcrumbsFor, localizedHref } from "@/lib/nav";

async function oauthClientHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function EditOAuthClientPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;
  const cancelHref = localizedHref(lang, "/identity-access/oauth-clients");
  const requestHeaders = await oauthClientHeaders();
  const result = await getOAuthClient(id, { headers: requestHeaders }).then(
    (client) => ({ client, error: null }),
    (error: Error) => ({ client: null, error: error.message })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor(`/identity-access/oauth-clients/${id}/edit`, lang)} />}
        description="Edita configuracion del cliente. El secreto nunca se muestra en esta vista."
        title="Editar OAuth client"
      />
      {result.error ? (
        <ErrorState error={new Error(result.error)} title="No se pudo cargar OAuth client" />
      ) : null}
      {result.client ? (
        <OAuthClientEditClient cancelHref={cancelHref} client={result.client} />
      ) : null}
    </div>
  );
}
