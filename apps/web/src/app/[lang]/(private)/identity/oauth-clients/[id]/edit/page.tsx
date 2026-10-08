import { OAuthClientEditData } from "@/features/identity-access/oauth-clients/oauth-client-edit-data";
import { localizedHref } from "@/lib/nav";

export default async function EditOAuthClientPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;
  const cancelHref = localizedHref(lang, `/identity/oauth-clients/${id}`);

  return (
    <OAuthClientEditData id={id} cancelHref={cancelHref} />
  );
}
