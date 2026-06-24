import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listSsoClients } from "@/features/identity-access/sso-clients/api";
import { SsoClientsClient } from "@/features/identity-access/sso-clients/sso-clients-client";
import { breadcrumbsFor } from "@/lib/nav";

async function ssoClientHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function SsoClientsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await ssoClientHeaders();
  const clientsResult = await listSsoClients({ headers: requestHeaders }).then(
    (clients) => ({ clients, error: null }),
    (error: Error) => ({ clients: [], error: error.message })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/sso-clients", lang)} />}
        description="Administra clientes SSO, redirects permitidos y origins."
        title="SSO clients"
      />
      <SsoClientsClient clients={clientsResult.clients} initialError={clientsResult.error} />
    </div>
  );
}
