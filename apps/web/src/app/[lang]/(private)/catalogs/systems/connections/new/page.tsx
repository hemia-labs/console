import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { Connections } from "@/features/systems/connections";
import { localizedHref } from "@/lib/nav";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ preset?: string }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={
          query.preset === "payments" ? "Conectar pagos" : "Conectar sistema"
        }
        description="Elige funciones, completa su configuración y guarda la conexión."
        actions={
          <Button
            variant="outline"
            className="min-h-10"
            render={<Link href={localizedHref(lang, "/catalogs/systems")} />}
          >
            Volver a sistemas
          </Button>
        }
      />
      <Connections
        preset={query.preset}
        systemsHref={localizedHref(lang, "/catalogs/systems")}
      />
    </div>
  );
}
