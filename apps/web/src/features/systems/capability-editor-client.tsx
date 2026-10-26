"use client";
import { getApiScopes } from "@/features/oauth-scopes/api";
import type { ApiScope } from "@/features/oauth-scopes/types";
import { localizedHref } from "@/lib/nav";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBreadcrumbTitle } from "@/components/breadcrumb-context";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { CapabilityForm } from "./capability-form";
import { getCapability, saveCapability } from "./capabilities-api";
import type { Capability } from "./types";

function CapabilityEditor({
  capability,
  listHref,
  scopes,
}: {
  capability?: Capability;
  listHref: string;
  scopes: ApiScope[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTitle } = useBreadcrumbTitle();
  useEffect(() => {
    if (capability) setTitle({ pathname, label: capability.name });
    return () => setTitle(null);
  }, [pathname, capability, setTitle]);

  async function save(value: Capability) {
    await saveCapability(value);
    router.replace(`${listHref}?saved=1`);
    router.refresh();
  }

  return (
    <CapabilityForm
      capability={capability}
      scopes={scopes}
      scopesHref={localizedHref(
        pathname.split("/")[1],
        "/catalogs/oauth-scopes",
      )}
      onSave={save}
      cancelHref={listHref}
    />
  );
}

export function CapabilityEditorClient({
  code,
  listHref,
}: {
  code?: string;
  listHref: string;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [capability, scopes] = await Promise.all([
        code ? getCapability(code, signal) : Promise.resolve(undefined),
        getApiScopes(signal),
      ]);
      return { capability, scopes };
    },
    [code],
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar la capacidad">
      {(data) => (
        <CapabilityEditor
          key={data.capability?.code ?? "new"}
          {...data}
          listHref={listHref}
        />
      )}
    </ConsoleDataLoader>
  );
}
