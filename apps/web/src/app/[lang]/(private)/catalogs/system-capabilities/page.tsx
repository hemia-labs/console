import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { CapabilitiesClient } from "@/features/systems/capabilities-client";
import { localizedHref } from "@/lib/nav";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const listHref = localizedHref(lang, "/catalogs/system-capabilities");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Capacidades de sistemas"
        description="Define los campos y validaciones que se mostrarán al configurar cada sistema."
        actions={
          <Button
            className="min-h-10 w-full sm:w-auto"
            render={<Link href={`${listHref}/new`} />}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva capacidad
          </Button>
        }
      />
      <CapabilitiesClient listHref={listHref} saved={query.saved === "1"} />
    </div>
  );
}
