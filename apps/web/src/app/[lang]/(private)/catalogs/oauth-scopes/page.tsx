import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { ScopesCatalog } from "@/features/oauth-scopes/scopes-catalog";
import { localizedHref } from "@/lib/nav";
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const listHref = localizedHref(lang, "/catalogs/oauth-scopes");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Scopes OAuth"
        description="Registra los permisos de las APIs para buscarlos y seleccionarlos en capacidades y clientes."
        actions={
          <Button
            className="min-h-10"
            render={<Link href={`${listHref}/new`} />}
          >
            Nuevo permiso
          </Button>
        }
      />
      <ScopesCatalog listHref={listHref} />
    </div>
  );
}
