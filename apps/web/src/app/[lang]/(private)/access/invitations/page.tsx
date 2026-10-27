import { PageHeader } from "@/components/page-header";
import { InvitationsClient } from "@/features/access/organizations/invitations-client";

export default async function InvitationsPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ page?: string; organization?: string }> }) {
  const { lang } = await params;
  const query = await searchParams;
  const number = Number(query.page);
  const page = Number.isSafeInteger(number) && number > 0 && number <= 1000000 ? number : 1;
  return <div className="space-y-6"><PageHeader title="Invitaciones" description="Consulta las invitaciones de tus organizaciones y administra su estado." /><InvitationsClient key={`${query.organization ?? "all"}:${page}`} locale={lang} page={page} organizationId={query.organization} /></div>;
}
