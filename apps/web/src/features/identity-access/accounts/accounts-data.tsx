"use client";

import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { listAccounts, getActiveAccount } from "./api";
import { AccountsClient } from "./accounts-client";

const load = async (signal: AbortSignal) => {
  const [accounts, activeAccount] = await Promise.all([
    listAccounts({ signal }),
    getActiveAccount({ signal }),
  ]);
  return { accounts, activeAccount };
};
export function AccountsData() {
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar cuentas">
      {({ accounts, activeAccount }, refresh) => (
        <AccountsClient
          accounts={accounts}
          activeAccount={activeAccount}
          onRefresh={refresh}
        />
      )}
    </ConsoleDataLoader>
  );
}
