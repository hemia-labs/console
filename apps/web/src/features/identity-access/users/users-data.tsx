"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import type { UserListQuery } from "@/features/identity-access/types";
import { listUsers } from "./api";
import { UsersClient } from "./users-client";

export function UsersData({ query }: { query: UserListQuery }) {
  const load = useCallback(
    (signal: AbortSignal) => listUsers(query, { signal }),
    [query]
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar usuarios">
      {(users, refresh) => <UsersClient users={users} onRefresh={refresh} />}
    </ConsoleDataLoader>
  );
}
