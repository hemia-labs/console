import { PageHeader } from "@/components/page-header";
import { ScopeEditor } from "@/features/oauth-scopes/scopes-catalog";
import { localizedHref } from "@/lib/nav";
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; id?: string }>;
}) {
  const { lang, id } = await params;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Editar permiso"
        description="Configura el permiso y la API que lo recibe."
      />
      <ScopeEditor
        id={id}
        listHref={localizedHref(lang, "/catalogs/oauth-scopes")}
      />
    </div>
  );
}
