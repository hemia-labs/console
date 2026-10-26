"use client";
import { getApiScopes } from "@/features/oauth-scopes/api";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localizedHref } from "@/lib/nav";
import { useBreadcrumbTitle } from "@/components/breadcrumb-context";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { getCapabilities } from "./capabilities-api";
import { getSystem, getSystemChoices, saveSystem } from "./systems-api";
import { SystemForm } from "./system-form";
import type { Capability, CatalogChoices, System, SystemDraft } from "./types";

function SystemEditor({
  system,
  capabilities,
  choices,
  listHref,
}: {
  system?: System;
  capabilities: Capability[];
  choices: CatalogChoices;
  listHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTitle } = useBreadcrumbTitle();
  useEffect(() => {
    if (system) setTitle({ pathname, label: system.name });
    return () => setTitle(null);
  }, [pathname, system, setTitle]);

  async function save(value: SystemDraft) {
    await saveSystem(value, system?.id);
    router.replace(`${listHref}?saved=1`);
    router.refresh();
  }

  return (
    <SystemForm
      system={system}
      capabilities={capabilities}
      choices={choices}
      onSave={save}
      cancelHref={listHref}
      identityClientsHref={localizedHref(
        pathname.split("/")[1],
        "/identity/oauth-clients",
      )}
    />
  );
}

export function SystemEditorClient({
  id,
  listHref,
}: {
  id?: string;
  listHref: string;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [system, capabilities, choices, scopes] = await Promise.all([
        id ? getSystem(id, signal) : Promise.resolve(undefined),
        getCapabilities(signal),
        getSystemChoices(signal),
        getApiScopes(signal),
      ]);
      return { system, capabilities, choices: { ...choices, scopes } };
    },
    [id],
  );
  return (
    <ConsoleDataLoader
      load={load}
      title="No se pudo cargar la configuración del sistema"
    >
      {(data) => (
        <SystemEditor
          key={data.system?.id ?? "new"}
          {...data}
          listHref={listHref}
        />
      )}
    </ConsoleDataLoader>
  );
}
