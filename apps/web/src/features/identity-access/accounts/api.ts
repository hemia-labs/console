import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type { IdentityAccount } from "@/features/identity-access/types";
import { readListFromPayload } from "@/features/identity-access/types";

const ACCOUNTS_PATH = "/identity-access/accounts";

export async function listAccounts(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(ACCOUNTS_PATH, options);
  return readListFromPayload<IdentityAccount>(payload, ["accounts"]);
}

export function getActiveAccount(options: ConsoleApiRequestOptions = {}) {
  return consoleApi.get<IdentityAccount>(`${ACCOUNTS_PATH}/active`, options);
}

export function switchAccount(accountIndex: number) {
  return consoleApi.post<unknown>(`${ACCOUNTS_PATH}/switch`, { accountIndex });
}

export function deleteAccount(accountIndex: number) {
  return consoleApi.delete<void>(`${ACCOUNTS_PATH}/${accountIndex}`);
}
