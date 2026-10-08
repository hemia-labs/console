import { OAuthClientDetailData } from "@/features/identity-access/oauth-clients/oauth-client-detail-data";

export default async function OAuthClientDetailPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;
  return <OAuthClientDetailData id={id} locale={lang} />;
}
