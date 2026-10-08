import { OrganizationDetailData } from "@/features/access/organizations/organization-detail-data";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ lang: string; organizationId: string }>;
}) {
  const { lang, organizationId } = await params;
  return (
    <OrganizationDetailData locale={lang} organizationId={organizationId} />
  );
}
