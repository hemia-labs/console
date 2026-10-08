import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/zuno/button";

import { PageHeader } from "@/components/page-header";
import { OAuthClientsData } from "@/features/identity-access/oauth-clients/oauth-clients-data";
import { localizedHref } from "@/lib/nav";

export default async function OAuthClientsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button
            className="h-10 px-4 font-semibold"
            render={<Link href={localizedHref(lang, "/identity/oauth-clients/new")} />}
          >
            <Plus className="size-4" />
            {"Crear OAuth client"}
          </Button>
        }
        description="Administra las aplicaciones que se conectan a Hemia y sus permisos de acceso."
        title={"OAuth clients"}
      />
      <OAuthClientsData locale={lang} />
    </div>
  );
}
