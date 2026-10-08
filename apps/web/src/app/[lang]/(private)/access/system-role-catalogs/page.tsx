import { PageHeader } from "@/components/page-header";
import { CatalogsClient } from "@/features/access/system-role-catalogs/catalogs-client";
export default function SystemRoleCatalogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogos de sistema"
        description="Administra las versiones de roles disponibles por sistema y publícalas en Access."
      />
      <CatalogsClient />
    </div>
  );
}
