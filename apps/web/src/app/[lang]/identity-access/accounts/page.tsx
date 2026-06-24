import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AccountsClient } from "@/features/identity-access/accounts/accounts-client";
import { getActiveAccount, listAccounts } from "@/features/identity-access/accounts/api";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { breadcrumbsFor } from "@/lib/nav";

async function accountsHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function AccountsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await accountsHeaders();
  const [accountsResult, activeResult] = await Promise.all([
    listAccounts({ headers: requestHeaders }).then(
      (accounts) => ({ accounts, error: null }),
      (error: Error) => ({ accounts: [], error: error.message })
    ),
    getActiveAccount({ headers: requestHeaders }).then(
      (activeAccount) => ({ activeAccount, error: null }),
      (error: Error) => ({ activeAccount: null, error: error.message })
    ),
  ]);

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/accounts", lang)} />}
        description="Gestiona cuentas conectadas y cambia la cuenta activa."
        title="Cuentas"
      />
      <AccountsClient
        accounts={accountsResult.accounts}
        activeAccount={activeResult.activeAccount}
        initialError={accountsResult.error ?? activeResult.error}
      />
    </div>
  );
}
