import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { CapabilityEditorClient } from "@/features/systems/capability-editor-client";
import { localizedHref } from "@/lib/nav";

export default async function CapabilityPage({
  params,
}: {
  params: Promise<{ lang: string; code: string }>;
}) {
  const { lang, code } = await params;
  const listHref = localizedHref(lang, "/catalogs/system-capabilities");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Editar capacidad"
        description="Organiza los campos del formulario y las reglas de su configuración."
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
      <CapabilityEditorClient key={code} code={code} listHref={listHref} />
    </div>
  );
}
