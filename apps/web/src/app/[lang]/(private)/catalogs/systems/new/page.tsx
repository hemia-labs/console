import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { SystemEditorClient } from "@/features/systems/system-editor-client";
import { localizedHref } from "@/lib/nav";

export default async function SystemPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const listHref = localizedHref(lang, "/catalogs/systems");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Nuevo sistema"
        description="Configura los datos y las capacidades del sistema."
        actions={
          <Button
            variant="outline"
            className="min-h-10"
            render={<Link href={listHref} />}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al catálogo
          </Button>
        }
      />
      <SystemEditorClient listHref={listHref} />
    </div>
  );
}
