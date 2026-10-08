import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { OAuthClientCreateClient } from "@/features/identity-access/oauth-clients/oauth-client-create-client";
import { localizedHref } from "@/lib/nav";

export default async function NewOAuthClientPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cancelHref = localizedHref(lang, "/identity/oauth-clients");

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        description="Crea un cliente OAuth. El secreto se muestra una sola vez al terminar."
        title="Crear OAuth client"
      />
      <OAuthClientCreateClient cancelHref={cancelHref} />
    </div>
  );
}
