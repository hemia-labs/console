import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/zuno/button";
import { NewInvitationClient } from "@/features/access/organizations/new-invitation-client";

export default async function NewInvitationPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ organization?: string }> }) {
  const { lang } = await params;
  const { organization } = await searchParams;
  return <div className="space-y-6"><PageHeader title="Nueva invitación" description="Selecciona una organización y los roles que tendrá la persona invitada." actions={<Button variant="outline" render={<Link href={`/${lang}/access/invitations`} />}><ArrowLeft className="size-4" aria-hidden="true" />Volver al listado</Button>} /><NewInvitationClient key={organization ?? "new"} locale={lang} initialOrganizationId={organization} /></div>;
}
