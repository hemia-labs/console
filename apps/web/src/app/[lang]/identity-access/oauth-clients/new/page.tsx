import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { OAuthClientCreateClient } from "@/features/identity-access/oauth-clients/oauth-client-create-client";
import { breadcrumbsFor, localizedHref } from "@/lib/nav";

export default async function NewOAuthClientPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cancelHref = localizedHref(lang, "/identity-access/oauth-clients");

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/oauth-clients/new", lang)} />}
        description="Crea un cliente OAuth. El secreto se muestra una sola vez al terminar."
        title="Crear OAuth client"
      />
      <OAuthClientCreateClient cancelHref={cancelHref} />
    </div>
  );
}
