import { PageHeader } from "@/components/page-header";
import { BillingRoleAssignments } from "@/features/access/billing-role-assignments";

export default function AccessRolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y permisos"
        description="Asigna roles publicados de Billing a miembros de una organización interna."
      />
      <BillingRoleAssignments />
    </div>
  );
}
