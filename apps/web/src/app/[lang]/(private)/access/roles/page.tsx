import { PageHeader } from "@/components/page-header";
import { SystemRoleAssignments } from "@/features/access/system-role-assignments";

export default function AccessRolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y permisos"
        description="Consulta permisos, asigna roles publicados y administra el acceso de cada miembro."
      />
      <SystemRoleAssignments />
    </div>
  );
}
