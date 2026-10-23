import Link from "next/link";
import { Plus, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { SystemsClient } from "@/features/systems/systems-client";
import { localizedHref } from "@/lib/nav";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const listHref = localizedHref(lang, "/catalogs/systems");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Sistemas"
        description="Administra los sistemas, sus capacidades y su configuración."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-10"
              render={<Link href={`${listHref}/connections/new`} />}
            >
              <PlugZap className="size-4" aria-hidden="true" />
              Conectar
            </Button>
            <Button
              variant="outline"
              className="min-h-10"
              render={
                <Link href={`${listHref}/connections/new?preset=payments`} />
              }
            >
              Conectar pagos
            </Button>
            <Button
              className="min-h-10 w-full sm:w-auto"
              render={<Link href={`${listHref}/new`} />}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo sistema
            </Button>
          </div>
        }
      />
      <SystemsClient listHref={listHref} saved={query.saved === "1"} />
    </div>
  );
}
