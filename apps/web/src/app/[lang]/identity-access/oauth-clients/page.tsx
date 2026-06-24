import { headers } from "next/headers";
import Link from "next/link";
import { Plus } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listOAuthClients } from "@/features/identity-access/oauth-clients/api";
import { OAuthClientsClient } from "@/features/identity-access/oauth-clients/oauth-clients-client";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { breadcrumbsFor, localizedHref } from "@/lib/nav";

async function oauthClientHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function OAuthClientsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const t = (await getDictionary(lang)).identityAccess.oauthClients;
  const requestHeaders = await oauthClientHeaders();
  const clientsResult = await listOAuthClients({}, { headers: requestHeaders }).then(
    (clients) => ({ clients, error: null }),
    (error: Error) => ({ clients: [], error: error.message })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        actions={
          <Link
            className="inline-flex h-11 w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            href={localizedHref(lang, "/identity-access/oauth-clients/new")}
          >
            <Plus className="size-5" />
            {t.actions.create}
          </Link>
        }
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/oauth-clients", lang)} />}
        description={t.description}
        title={t.title}
      />
      <OAuthClientsClient
        clients={clientsResult.clients}
        initialError={clientsResult.error}
        locale={lang}
      />
    </div>
  );
}
