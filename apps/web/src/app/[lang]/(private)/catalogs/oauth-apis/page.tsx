import { PageHeader } from "@/components/page-header";
import { OAuthApisCatalog } from "@/features/oauth-scopes/apis-catalog";
export default function Page() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="APIs OAuth"
        description="Define la audiencia, URL y permisos que admite cada API."
      />
      <OAuthApisCatalog />
    </div>
  );
}
